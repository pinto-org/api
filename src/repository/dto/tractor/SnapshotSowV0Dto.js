class SnapshotSowV0Dto {
  constructor(type, d) {
    if (type === 'init') {
      const { block, timestamp, season, snapshotData } = d;
      this.snapshotTimestamp = timestamp;
      this.snapshotBlock = block;
      this.season = season;
      this.totalPintoSown = BigInt(snapshotData.sum_beans);
      this.totalPodsMinted = BigInt(snapshotData.sum_pods);
      this.totalCascadeFundedBelowTemp = BigInt(snapshotData.sum_cascade_below_temp);
      this.totalCascadeFundedAnyTemp = BigInt(snapshotData.sum_cascade_total);
      this.totalTipsPaid = BigInt(snapshotData.sum_paid_tips);
      this.currentMaxTip = BigInt(snapshotData.max_bean_tip);
      this.totalExecutions = snapshotData.count_executions;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.totalPintoSown = d.totalPintoSown;
      this.totalPodsMinted = d.totalPodsMinted;
      this.totalCascadeFundedBelowTemp = d.totalCascadeFundedBelowTemp;
      this.totalCascadeFundedAnyTemp = d.totalCascadeFundedAnyTemp;
      this.totalTipsPaid = d.totalTipsPaid;
      this.currentMaxTip = d.currentMaxTip;
      this.totalExecutions = d.totalExecutions;
    }
  }

  static fromLiveSnapshot(liveSnapshot) {
    return new SnapshotSowV0Dto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new SnapshotSowV0Dto('model', dbModel);
  }
}

module.exports = SnapshotSowV0Dto;
