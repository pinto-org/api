const { C } = require('../../constants/runtime-constants');
const Contracts = require('../../datasources/contracts/contracts');
const SnapshotSowV0Dto = require('../../repository/dto/tractor/SnapshotSowV0Dto');
const { sequelize } = require('../../repository/postgres/models');
const SnapshotSowV0Assembler = require('../../repository/postgres/models/assemblers/tractor/snapshot-sow-v0-assembler');
const SharedRepository = require('../../repository/postgres/queries/shared-repository');
const SnapshotSowV0Repository = require('../../repository/postgres/queries/snapshot-sow-v0-repository');
const AsyncContext = require('../../utils/async/context');
const ChainUtil = require('../../utils/chain');

class SnapshotSowV0Service {
  // Returns the block number of when the next snapshot should be taken
  static async nextSnapshotBlock() {
    const latestSnapshot = await SnapshotSowV0Repository.latestSnapshot();
    if (latestSnapshot) {
      const dto = SnapshotSowV0Assembler.fromModel(latestSnapshot);
      return dto.snapshotBlock + ChainUtil.blocksPerInterval(C().CHAIN, 1000 * 60 * 60);
    }

    // Initial snapshot is according to the block of the first sow v0 order. Hardcoded value is acceptable.
    return 29115727;
  }

  // Inserts a snapshot of the current state.
  // Data must have already been updated through snapshotBlock (having written to meta is optional).
  static async takeSnapshot(snapshotBlock) {
    const blockTimestamp = new Date((await C().RPC.getBlock(snapshotBlock)).timestamp * 1000);
    const temperature = BigInt(await Contracts.getBeanstalk().maxTemperature({ blockTag: snapshotBlock }));
    const [[result]] = await sequelize.query(
      `SELECT
        (SELECT COALESCE(SUM(beans), 0) FROM tractor_execution_sow_v0) AS sum_beans,
        (SELECT COALESCE(SUM(pods), 0) FROM tractor_execution_sow_v0) AS sum_pods,
        (SELECT COALESCE(SUM("cascadeAmountFunded"), 0) FROM tractor_order_sow_v0 WHERE "minTemp" < ${Number(temperature)}) AS sum_cascade_below_temp,
        (SELECT COALESCE(SUM("cascadeAmountFunded"), 0) FROM tractor_order_sow_v0) AS sum_cascade_total,
        (SELECT COALESCE(SUM(o."beanTip"), 0) FROM tractor_order o JOIN tractor_execution e ON o."blueprintHash" = e."blueprintHash") AS sum_paid_tips,
        (SELECT COALESCE(MAX(o."beanTip"), 0) FROM tractor_order o, tractor_order_sow_v0 as osow WHERE o."orderType" = 'SOW_V0' AND NOT o.cancelled AND NOT osow."orderComplete") AS max_bean_tip,
        (SELECT COUNT(*) FROM tractor_execution_sow_v0) AS count_executions;`,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    const dto = SnapshotSowV0Dto.fromLiveSnapshot({
      block: snapshotBlock,
      timestamp: blockTimestamp,
      snapshotData: result
    });
    const model = SnapshotSowV0Assembler.toModel(dto);

    await SharedRepository.genericUpsert(sequelize.models.TractorSnapshotSowV0, [model], false);
  }
}

module.exports = SnapshotSowV0Service;
