const { C } = require('../../../constants/runtime-constants');
const {
  TRACTOR_ORDER_CONVERT_UP_TABLE,
  TRACTOR_ORDER_TABLE,
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_CONVERT_UP_TABLE
} = require('../../../constants/tables');
const Contracts = require('../../../datasources/contracts/contracts');
const SnapshotConvertUpDto = require('../../../repository/dto/tractor/SnapshotConvertUpDto');
const { sequelize } = require('../../../repository/postgres/models');
const SnapshotConvertUpAssembler = require('../../../repository/postgres/models/assemblers/tractor/snapshot-convert-up-assembler');
const SharedRepository = require('../../../repository/postgres/queries/shared-repository');
const TractorSnapshotRepository = require('../../../repository/postgres/queries/tractor-snapshot-repository');
const AsyncContext = require('../../../utils/async/context');
const BlockUtil = require('../../../utils/block');
const EnvUtil = require('../../../utils/env');
const TractorSnapshotService = require('./tractor-snapshot-service');

class SnapshotConvertUpService extends TractorSnapshotService {
  static snapshotRepository = new TractorSnapshotRepository(sequelize.models.TractorSnapshotConvertUp);
  static snapshotAssembler = SnapshotConvertUpAssembler;
  static initialSnapshotBlock = EnvUtil.getDevTractor().seedBlock ?? 37197727;

  static async takeSnapshot(snapshotBlock) {
    const blockTimestamp = new Date((await C().RPC.getBlock(snapshotBlock)).timestamp * 1000);
    const season = Number(await Contracts.getBeanstalk().season({ blockTag: BlockUtil.pauseGuard(snapshotBlock) }));

    const o = TRACTOR_ORDER_TABLE.env;
    const e = TRACTOR_EXECUTION_TABLE.env;
    const oconv = TRACTOR_ORDER_CONVERT_UP_TABLE.env;
    const econv = TRACTOR_EXECUTION_CONVERT_UP_TABLE.env;
    const [[result]] = await sequelize.query(
      // There should perhaps also be a sum_cascade_below_line_length
      `SELECT
        (SELECT COALESCE(SUM("beansConverted"), 0) FROM ${econv}) AS sum_beans,
        (SELECT COALESCE(SUM("gsBonusStalk"), 0) FROM ${econv}) AS sum_gs_bonus_stalk,
        (SELECT COALESCE(SUM("gsBonusBdv"), 0) FROM ${econv}) AS sum_gs_bonus_bdv,
        (SELECT COALESCE(SUM("gsPenaltyStalk"), 0) FROM ${econv}) AS sum_gs_penalty_stalk,
        (SELECT COALESCE(SUM("gsPenaltyBdv"), 0) FROM ${econv}) AS sum_gs_penalty_bdv,
        (SELECT COALESCE(SUM(oconv."cascadeAmountFunded"), 0) FROM ${o} o, ${oconv} oconv WHERE o."blueprintHash" = oconv."blueprintHash" AND NOT o.cancelled AND NOT oconv."orderComplete") AS sum_cascade_total,
        (SELECT COALESCE(SUM(oconv."cascadeAmountFunded"), 0) FROM ${o} o, ${oconv} oconv WHERE o."blueprintHash" = oconv."blueprintHash" AND NOT o.cancelled AND NOT oconv."orderComplete" AND o."lastExecutableSeason" = ${season}) AS sum_cascade_executable,
        (SELECT COALESCE(SUM(o."beanTip"), 0) FROM ${o} o JOIN ${e} e ON o."blueprintHash" = e."blueprintHash" WHERE o."orderType" = 'CONVERT_UP') AS sum_paid_tips,
        (SELECT COALESCE(MAX(o."beanTip"), 0) FROM ${o} o, ${oconv} oconv WHERE o."blueprintHash" = oconv."blueprintHash" AND NOT o.cancelled AND NOT oconv."orderComplete" AND oconv."amountFunded" > 0 AND o."lastExecutableSeason" = ${season}) AS max_bean_tip,
        (SELECT COUNT(*) FROM ${econv}) AS count_executions,
        (SELECT COUNT(DISTINCT o."publisher") FROM ${o} o WHERE o."orderType" = 'CONVERT_UP') AS unique_publishers;`,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    const dto = SnapshotConvertUpDto.fromLiveSnapshot({
      block: snapshotBlock,
      timestamp: blockTimestamp,
      season,
      snapshotData: result
    });
    const model = this.snapshotAssembler.toModel(dto);

    await SharedRepository.genericUpsert(sequelize.models.TractorSnapshotConvertUp, [model], false);
  }
}

module.exports = SnapshotConvertUpService;
