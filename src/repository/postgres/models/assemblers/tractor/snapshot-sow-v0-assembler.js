const SnapshotSowV0Dto = require('../../../../dto/tractor/SnapshotSowV0Dto');

class SnapshotSowV0Assembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      totalPintoSown: snapshotDto.totalPintoSown,
      totalPodsMinted: snapshotDto.totalPodsMinted,
      totalCascadeFundedBelowTemp: snapshotDto.totalCascadeFundedBelowTemp,
      totalCascadeFundedAnyTemp: snapshotDto.totalCascadeFundedAnyTemp,
      totalTipsPaid: snapshotDto.totalTipsPaid,
      currentMaxTip: snapshotDto.currentMaxTip,
      totalExecutions: snapshotDto.totalExecutions
    };
  }

  static fromModel(snapshotModel) {
    return SnapshotSowV0Dto.fromModel(snapshotModel);
  }
}
module.exports = SnapshotSowV0Assembler;
