const { C } = require('../../../constants/runtime-constants');
const {
  TRACTOR_ORDER_CONVERT_UP_V0_TABLE,
  TRACTOR_ORDER_TABLE,
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE
} = require('../../../constants/tables');
const SnapshotConvertUpV0Dto = require('../../../repository/dto/tractor/SnapshotConvertUpV0Dto');
const { sequelize } = require('../../../repository/postgres/models');
const SnapshotConvertUpV0Assembler = require('../../../repository/postgres/models/assemblers/tractor/snapshot-convert-up-v0-assembler');
const SharedRepository = require('../../../repository/postgres/queries/shared-repository');
const TractorSnapshotRepository = require('../../../repository/postgres/queries/tractor-snapshot-repository');
const TractorSnapshotService = require('./tractor-snapshot-service');

class SnapshotConvertUpV0Service extends TractorSnapshotService {
  static snapshotRepository = new TractorSnapshotRepository(sequelize.models.TractorSnapshotConvertUpV0);
  static snapshotAssembler = SnapshotConvertUpV0Assembler;
  static initialSnapshotBlock = 999999999999; // TODO once it occurs onchain

  static async takeSnapshot(snapshotBlock) {
    const blockTimestamp = new Date((await C().RPC.getBlock(snapshotBlock)).timestamp * 1000);
    const o = TRACTOR_ORDER_TABLE.env;
    const e = TRACTOR_EXECUTION_TABLE.env;
    const oconv = TRACTOR_ORDER_CONVERT_UP_V0_TABLE.env;
    const econv = TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.env;
    const [[result]] = await sequelize.query(
      // There should perhaps also be a sum_cascade_below_line_length
      `SELECT
        (SELECT COALESCE(SUM("beansConverted"), 0) FROM ${econv}) AS sum_beans,
        (SELECT COALESCE(SUM("gsBonusAmount"), 0) FROM ${econv}) AS sum_gs_bonus_stalk,
        (SELECT COALESCE(SUM("gsBonusBdv"), 0) FROM ${econv}) AS sum_gs_bonus_bdv,
        (SELECT COALESCE(SUM("gsPenaltyAmount"), 0) FROM ${econv}) AS sum_gs_penalty_stalk,
        (SELECT COALESCE(SUM("gsPenaltyBdv"), 0) FROM ${econv}) AS sum_gs_penalty_bdv,
        (SELECT COALESCE(SUM(oconv."cascadeAmountFunded"), 0) FROM ${o} o, ${oconv} oconv WHERE o."blueprintHash" = oconv."blueprintHash" AND NOT o.cancelled AND NOT oconv."orderComplete") AS sum_cascade_total,
        (SELECT COALESCE(SUM(o."beanTip"), 0) FROM ${o} o JOIN ${e} e ON o."blueprintHash" = e."blueprintHash" WHERE o."orderType" = 'CONVERT_UP_V0') AS sum_paid_tips,
        -- TODO: maxBeanTip requires the executable this season data to be correct
        (SELECT COALESCE(MAX(o."beanTip"), 0) FROM ${o} o, ${oconv} oconv WHERE o."blueprintHash" = oconv."blueprintHash" AND NOT o.cancelled AND NOT oconv."orderComplete" AND oconv."amountFunded" > 0) AS max_bean_tip,
        (SELECT COUNT(*) FROM ${econv}) AS count_executions,
        (SELECT COUNT(DISTINCT o."publisher") FROM ${o} o WHERE o."orderType" = 'CONVERT_UP_V0') AS unique_publishers;`,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    const dto = SnapshotConvertUpV0Dto.fromLiveSnapshot({
      block: snapshotBlock,
      timestamp: blockTimestamp,
      season,
      snapshotData: result
    });
    const model = this.snapshotAssembler.toModel(dto);

    await SharedRepository.genericUpsert(sequelize.models.TractorSnapshotConvertUpV0, [model], false);
  }
}

module.exports = SnapshotConvertUpV0Service;
