class FieldInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBeans = BigInt(d.cumulative_beans ?? 0n);
      this.deltaBeans = BigInt(d.delta_beans ?? 0n);
      this.cumulativeUsd = d.cumulative_usd ?? 0;
      this.deltaUsd = d.delta_usd ?? 0;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.cumulativeBeans = d.cumulativeBeans;
      this.deltaBeans = d.deltaBeans;
      this.cumulativeUsd = d.cumulativeUsd;
      this.deltaUsd = d.deltaUsd;
    }
  }

  static fromLiveSnapshot(liveSnapshot) {
    return new FieldInflowSnapshotDto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new FieldInflowSnapshotDto('model', dbModel);
  }
}

module.exports = FieldInflowSnapshotDto;
