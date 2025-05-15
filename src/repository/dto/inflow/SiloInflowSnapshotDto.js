class SiloInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBdv = BigInt(d.cumulative_bdv);
      this.deltaBdv = BigInt(d.delta_bdv ?? 0n);
      this.cumulativeUsd = d.cumulative_usd;
      this.deltaUsd = d.delta_usd ?? 0;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.cumulativeBdv = d.cumulativeBdv;
      this.deltaBdv = d.deltaBdv;
      this.cumulativeUsd = d.cumulativeUsd;
      this.deltaUsd = d.deltaUsd;
    }
  }

  static fromLiveSnapshot(liveSnapshot) {
    return new SiloInflowSnapshotDto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new SiloInflowSnapshotDto('model', dbModel);
  }
}

module.exports = SiloInflowSnapshotDto;
