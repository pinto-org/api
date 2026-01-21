const SnapshotConvertUpDto = require('../../../../dto/tractor/SnapshotConvertUpDto');

class SnapshotConvertUpAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      totalBeansConverted: snapshotDto.totalBeansConverted,
      totalGsBonusStalk: snapshotDto.totalGsBonusStalk,
      totalGsBonusBdv: snapshotDto.totalGsBonusBdv,
      totalGsPenaltyStalk: snapshotDto.totalGsPenaltyStalk,
      totalGsPenaltyBdv: snapshotDto.totalGsPenaltyBdv,
      totalCascadeFunded: snapshotDto.totalCascadeFunded,
      totalCascadeFundedExecutable: snapshotDto.totalCascadeFundedExecutable,
      totalTipsPaid: snapshotDto.totalTipsPaid,
      currentMaxTip: snapshotDto.currentMaxTip,
      totalExecutions: snapshotDto.totalExecutions,
      uniquePublishers: snapshotDto.uniquePublishers
    };
  }

  static fromModel(snapshotModel) {
    return SnapshotConvertUpDto.fromModel(snapshotModel);
  }
}
module.exports = SnapshotConvertUpAssembler;
