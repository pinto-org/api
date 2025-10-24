class SiloInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBdvNet = BigInt(d.cumulative_bdv_net ?? 0);
      this.cumulativeBdvIn = BigInt(d.cumulative_bdv_in ?? 0);
      this.cumulativeBdvOut = BigInt(d.cumulative_bdv_out ?? 0);
      this.deltaBdvNet = BigInt(d.delta_bdv_net ?? d.cumulative_bdv_net ?? 0);
      this.deltaBdvIn = BigInt(d.delta_bdv_in ?? d.cumulative_bdv_in ?? 0);
      this.deltaBdvOut = BigInt(d.delta_bdv_out ?? d.cumulative_bdv_out ?? 0);
      this.cumulativeUsdNet = d.cumulative_usd_net ?? 0;
      this.cumulativeUsdIn = d.cumulative_usd_in ?? 0;
      this.cumulativeUsdOut = d.cumulative_usd_out ?? 0;
      this.deltaUsdNet = d.delta_usd_net ?? d.cumulative_usd_net ?? 0;
      this.deltaUsdIn = d.delta_usd_in ?? d.cumulative_usd_in ?? 0;
      this.deltaUsdOut = d.delta_usd_out ?? d.cumulative_usd_out ?? 0;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.cumulativeBdvNet = d.cumulativeBdvNet;
      this.cumulativeBdvIn = d.cumulativeBdvIn;
      this.cumulativeBdvOut = d.cumulativeBdvOut;
      this.deltaBdvNet = d.deltaBdvNet;
      this.deltaBdvIn = d.deltaBdvIn;
      this.deltaBdvOut = d.deltaBdvOut;
      this.cumulativeUsdNet = d.cumulativeUsdNet;
      this.cumulativeUsdIn = d.cumulativeUsdIn;
      this.cumulativeUsdOut = d.cumulativeUsdOut;
      this.deltaUsdNet = d.deltaUsdNet;
      this.deltaUsdIn = d.deltaUsdIn;
      this.deltaUsdOut = d.deltaUsdOut;
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
