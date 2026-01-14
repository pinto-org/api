class SnapshotSowDto {
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
      this.maxSowThisSeason = BigInt(snapshotData.max_sow_this_season);
      this.totalTipsPaid = BigInt(snapshotData.sum_paid_tips);
      this.currentMaxTip = BigInt(snapshotData.max_bean_tip);
      this.totalExecutions = snapshotData.count_executions;
      this.uniquePublishers = snapshotData.unique_publishers;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.totalPintoSown = d.totalPintoSown;
      this.totalPodsMinted = d.totalPodsMinted;
      this.totalCascadeFundedBelowTemp = d.totalCascadeFundedBelowTemp;
      this.totalCascadeFundedAnyTemp = d.totalCascadeFundedAnyTemp;
      this.maxSowThisSeason = d.maxSowThisSeason;
      this.totalTipsPaid = d.totalTipsPaid;
      this.currentMaxTip = d.currentMaxTip;
      this.totalExecutions = d.totalExecutions;
      this.uniquePublishers = d.uniquePublishers;
    }
  }

  static fromLiveSnapshot(liveSnapshot) {
    return new SnapshotSowDto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new SnapshotSowDto('model', dbModel);
  }
}

module.exports = SnapshotSowDto;
