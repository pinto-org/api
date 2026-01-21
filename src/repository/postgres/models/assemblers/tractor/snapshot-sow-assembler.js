const SnapshotSowDto = require('../../../../dto/tractor/SnapshotSowDto');

class SnapshotSowAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      totalPintoSown: snapshotDto.totalPintoSown,
      totalPodsMinted: snapshotDto.totalPodsMinted,
      totalCascadeFundedBelowTemp: snapshotDto.totalCascadeFundedBelowTemp,
      totalCascadeFundedAnyTemp: snapshotDto.totalCascadeFundedAnyTemp,
      maxSowThisSeason: snapshotDto.maxSowThisSeason,
      totalTipsPaid: snapshotDto.totalTipsPaid,
      currentMaxTip: snapshotDto.currentMaxTip,
      totalExecutions: snapshotDto.totalExecutions,
      uniquePublishers: snapshotDto.uniquePublishers
    };
  }

  static fromModel(snapshotModel) {
    return SnapshotSowDto.fromModel(snapshotModel);
  }
}
module.exports = SnapshotSowAssembler;
