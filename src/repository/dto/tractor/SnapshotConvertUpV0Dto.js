class SnapshotConvertUpV0Dto {
  constructor(type, d) {
    if (type === 'init') {
      const { block, timestamp, season, snapshotData } = d;
      this.snapshotTimestamp = timestamp;
      this.snapshotBlock = block;
      this.season = season;
      this.totalBeansConverted = BigInt(snapshotData.sum_beans);
      this.totalGsBonusStalk = BigInt(snapshotData.sum_gs_bonus_stalk);
      this.totalGsBonusBdv = BigInt(snapshotData.sum_gs_bonus_bdv);
      this.totalGsPenaltyStalk = BigInt(snapshotData.sum_gs_penalty_stalk);
      this.totalGsPenaltyBdv = BigInt(snapshotData.sum_gs_penalty_bdv);
      this.totalCascadeFunded = BigInt(snapshotData.sum_cascade_total);
      this.totalCascadeFundedExecutable = BigInt(snapshotData.sum_cascade_executable);
      this.totalTipsPaid = BigInt(snapshotData.sum_paid_tips);
      this.currentMaxTip = BigInt(snapshotData.max_bean_tip);
      this.totalExecutions = snapshotData.count_executions;
      this.uniquePublishers = snapshotData.unique_publishers;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.totalBeansConverted = d.totalBeansConverted;
      this.totalGsBonusStalk = d.totalGsBonusStalk;
      this.totalGsBonusBdv = d.totalGsBonusBdv;
      this.totalGsPenaltyStalk = d.totalGsPenaltyStalk;
      this.totalGsPenaltyBdv = d.totalGsPenaltyBdv;
      this.totalCascadeFunded = d.totalCascadeFunded;
      this.totalCascadeFundedExecutable = d.totalCascadeFundedExecutable;
      this.totalTipsPaid = d.totalTipsPaid;
      this.currentMaxTip = d.currentMaxTip;
      this.totalExecutions = d.totalExecutions;
      this.uniquePublishers = d.uniquePublishers;
    }
  }

  static fromLiveSnapshot(liveSnapshot) {
    return new SnapshotConvertUpV0Dto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new SnapshotConvertUpV0Dto('model', dbModel);
  }
}

module.exports = SnapshotConvertUpV0Dto;
