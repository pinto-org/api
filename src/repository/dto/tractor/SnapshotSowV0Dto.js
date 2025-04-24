class SnapshotSowV0Dto {
  constructor(type, d) {
    if (type === 'db') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.totalPintoSown = d.totalPintoSown;
      this.totalPodsMinted = d.totalPodsMinted;
      this.totalCascadeFundedBelowTemp = d.totalCascadeFundedBelowTemp;
      this.totalCascadeFundedAnyTemp = d.totalCascadeFundedAnyTemp;
      this.totalTipsPaid = d.totalTipsPaid;
      this.currentMaxTip = d.currentMaxTip;
      this.totalExecutions = d.totalExecutions;
    }
  }

  static fromModel(dbModel) {
    return new SnapshotSowV0Dto('db', dbModel);
  }
}

module.exports = SnapshotSowV0Dto;
