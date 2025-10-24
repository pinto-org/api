class FieldInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBeansNet = BigInt(d.cumulative_beans_net ?? 0);
      this.cumulativeBeansIn = BigInt(d.cumulative_beans_in ?? 0);
      this.cumulativeBeansOut = BigInt(d.cumulative_beans_out ?? 0);
      this.deltaBeansNet = BigInt(d.delta_beans_net ?? d.cumulative_beans_net ?? 0);
      this.deltaBeansIn = BigInt(d.delta_beans_in ?? d.cumulative_beans_in ?? 0);
      this.deltaBeansOut = BigInt(d.delta_beans_out ?? d.cumulative_beans_out ?? 0);
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
      this.cumulativeBeansNet = d.cumulativeBeansNet;
      this.cumulativeBeansIn = d.cumulativeBeansIn;
      this.cumulativeBeansOut = d.cumulativeBeansOut;
      this.deltaBeansNet = d.deltaBeansNet;
      this.deltaBeansIn = d.deltaBeansIn;
      this.deltaBeansOut = d.deltaBeansOut;
      this.cumulativeUsdNet = d.cumulativeUsdNet;
      this.cumulativeUsdIn = d.cumulativeUsdIn;
      this.cumulativeUsdOut = d.cumulativeUsdOut;
      this.deltaUsdNet = d.deltaUsdNet;
      this.deltaUsdIn = d.deltaUsdIn;
      this.deltaUsdOut = d.deltaUsdOut;
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
