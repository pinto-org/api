const { C } = require('../../../constants/runtime-constants');
const {
  TRACTOR_EXECUTION_SOW_V0_TABLE,
  TRACTOR_ORDER_SOW_V0_TABLE,
  TRACTOR_ORDER_TABLE,
  TRACTOR_EXECUTION_TABLE
} = require('../../../constants/tables');
const Contracts = require('../../../datasources/contracts/contracts');
const SnapshotSowV0Dto = require('../../../repository/dto/tractor/SnapshotSowV0Dto');
const { sequelize, Sequelize } = require('../../../repository/postgres/models');
const SnapshotSowV0Assembler = require('../../../repository/postgres/models/assemblers/tractor/snapshot-sow-v0-assembler');
const SharedRepository = require('../../../repository/postgres/queries/shared-repository');
const SnapshotSowV0Repository = require('../../../repository/postgres/queries/snapshot-sow-v0-repository');
const AsyncContext = require('../../../utils/async/context');
const BlockUtil = require('../../../utils/block');
const ChainUtil = require('../../../utils/chain');
const AppMetaService = require('../../meta-service');

class SnapshotSowV0Service {
  static async nextSnapshotBlock() {
    const latestSnapshot = await SnapshotSowV0Repository.latestSnapshot();
    if (latestSnapshot) {
      const dto = SnapshotSowV0Assembler.fromModel(latestSnapshot);
      return dto.snapshotBlock + ChainUtil.blocksPerInterval(C().CHAIN, 1000 * 60 * 60);
    }

    // Initial snapshot is according to the block of the first sow v0 order. Hardcoded value is acceptable.
    return 29115727;
  }

  static async takeSnapshot(snapshotBlock) {
    const blockTimestamp = new Date((await C().RPC.getBlock(snapshotBlock)).timestamp * 1000);
    // Set the block to before any pause if this hour was while the diamond was paused
    const blockTag = BlockUtil.pauseGuard(snapshotBlock);
    const [season, temperature] = await Promise.all([
      (async () => Number(await Contracts.getBeanstalk().season({ blockTag })))(),
      (async () => BigInt(await Contracts.getBeanstalk().maxTemperature({ blockTag })))()
    ]);
    const o = TRACTOR_ORDER_TABLE.env;
    const e = TRACTOR_EXECUTION_TABLE.env;
    const osow = TRACTOR_ORDER_SOW_V0_TABLE.env;
    const esow = TRACTOR_EXECUTION_SOW_V0_TABLE.env;
    const [[result]] = await sequelize.query(
      // There should perhaps also be a sum_cascade_below_line_length
      `SELECT
        (SELECT COALESCE(SUM(beans), 0) FROM ${esow}) AS sum_beans,
        (SELECT COALESCE(SUM(pods), 0) FROM ${esow}) AS sum_pods,
        (SELECT COALESCE(SUM(osow."cascadeAmountFunded"), 0) FROM ${o} o, ${osow} osow WHERE osow."minTemp" <= ${Number(temperature)} AND o."blueprintHash" = osow."blueprintHash" AND NOT o.cancelled AND NOT osow."orderComplete") AS sum_cascade_below_temp,
        (SELECT COALESCE(SUM(osow."cascadeAmountFunded"), 0) FROM ${o} o, ${osow} osow WHERE o."blueprintHash" = osow."blueprintHash" AND NOT o.cancelled AND NOT osow."orderComplete") AS sum_cascade_total,
        (SELECT COALESCE(SUM(LEAST(osow."cascadeAmountFunded", osow."maxAmountToSowPerSeason")), 0) FROM ${osow} osow WHERE osow."minTemp" <= ${Number(temperature)}) AS max_sow_this_season,
        (SELECT COALESCE(SUM(o."beanTip"), 0) FROM ${o} o JOIN ${e} e ON o."blueprintHash" = e."blueprintHash" WHERE o."orderType" = 'SOW_V0') AS sum_paid_tips,
        (SELECT COALESCE(MAX(o."beanTip"), 0) FROM ${o} o, ${osow} osow WHERE o."blueprintHash" = osow."blueprintHash" AND NOT o.cancelled AND NOT osow."orderComplete" AND osow."amountFunded" > 0 AND osow."minTemp" <= ${Number(temperature)}) AS max_bean_tip,
        (SELECT COUNT(*) FROM ${esow}) AS count_executions,
        (SELECT COUNT(DISTINCT o."publisher") FROM ${o} o WHERE o."orderType" = 'SOW_V0') AS unique_publishers;`,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    const dto = SnapshotSowV0Dto.fromLiveSnapshot({
      block: snapshotBlock,
      timestamp: blockTimestamp,
      season,
      snapshotData: result
    });
    const model = SnapshotSowV0Assembler.toModel(dto);

    await SharedRepository.genericUpsert(sequelize.models.TractorSnapshotSowV0, [model], false);
  }

  /**
   * @param {import('../../../../types/types').TractorSnapshotsRequest} request
   * @returns {Promise<import('../../../../types/types').TractorSnapshotsResult>}
   */
  static async getSnapshots(request) {
    const criteriaList = [];
    if (request.betweenTimes) {
      criteriaList.push({
        snapshotTimestamp: {
          [Sequelize.Op.between]: request.betweenTimes
        }
      });
    }
    if (request.betweenSeasons) {
      criteriaList.push({
        season: {
          [Sequelize.Op.between]: request.betweenSeasons
        }
      });
    }
    request.limit ??= 100;

    const { snapshots, total, lastUpdated } = await AsyncContext.sequelizeTransaction(async () => {
      const [{ snapshots, total }, tractorMeta] = await Promise.all([
        SnapshotSowV0Repository.findAllWithOptions({
          criteriaList,
          ...request
        }),
        AppMetaService.getTractorMeta()
      ]);
      return { snapshots, total, lastUpdated: tractorMeta.lastUpdate };
    });
    let dtos = snapshots.map((d) => {
      const dto = SnapshotSowV0Assembler.fromModel(d);
      delete dto.id;
      return dto;
    });

    return {
      lastUpdated,
      snapshots: dtos,
      totalRecords: total
    };
  }
}

module.exports = SnapshotSowV0Service;
