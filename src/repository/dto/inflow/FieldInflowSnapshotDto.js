class FieldInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBeansNet = BigInt(d.cumulative_beans_net ?? 0);
      this.cumulativeBeansIn = BigInt(d.cumulative_beans_in ?? 0);
      this.cumulativeBeansOut = BigInt(d.cumulative_beans_out ?? 0);
      this.cumulativeProtocolBeansNet = BigInt(d.cumulative_protocol_beans_net ?? 0);
      this.cumulativeProtocolBeansIn = BigInt(d.cumulative_protocol_beans_in ?? 0);
      this.cumulativeProtocolBeansOut = BigInt(d.cumulative_protocol_beans_out ?? 0);
      this.deltaBeansNet = BigInt(d.delta_beans_net ?? d.cumulative_beans_net ?? 0);
      this.deltaBeansIn = BigInt(d.delta_beans_in ?? d.cumulative_beans_in ?? 0);
      this.deltaBeansOut = BigInt(d.delta_beans_out ?? d.cumulative_beans_out ?? 0);
      this.deltaProtocolBeansNet = BigInt(d.delta_protocol_beans_net ?? d.cumulative_protocol_beans_net ?? 0);
      this.deltaProtocolBeansIn = BigInt(d.delta_protocol_beans_in ?? d.cumulative_protocol_beans_in ?? 0);
      this.deltaProtocolBeansOut = BigInt(d.delta_protocol_beans_out ?? d.cumulative_protocol_beans_out ?? 0);
      this.cumulativeUsdNet = d.cumulative_usd_net ?? 0;
      this.cumulativeUsdIn = d.cumulative_usd_in ?? 0;
      this.cumulativeUsdOut = d.cumulative_usd_out ?? 0;
      this.cumulativeProtocolUsdNet = d.cumulative_protocol_usd_net ?? 0;
      this.cumulativeProtocolUsdIn = d.cumulative_protocol_usd_in ?? 0;
      this.cumulativeProtocolUsdOut = d.cumulative_protocol_usd_out ?? 0;
      this.deltaUsdNet = d.delta_usd_net ?? d.cumulative_usd_net ?? 0;
      this.deltaUsdIn = d.delta_usd_in ?? d.cumulative_usd_in ?? 0;
      this.deltaUsdOut = d.delta_usd_out ?? d.cumulative_usd_out ?? 0;
      this.deltaProtocolUsdNet = d.delta_protocol_usd_net ?? d.cumulative_protocol_usd_net ?? 0;
      this.deltaProtocolUsdIn = d.delta_protocol_usd_in ?? d.cumulative_protocol_usd_in ?? 0;
      this.deltaProtocolUsdOut = d.delta_protocol_usd_out ?? d.cumulative_protocol_usd_out ?? 0;
    } else if (type === 'model') {
      this.id = d.id;
      this.snapshotTimestamp = d.snapshotTimestamp;
      this.snapshotBlock = d.snapshotBlock;
      this.season = d.season;
      this.cumulativeBeansNet = d.cumulativeBeansNet;
      this.cumulativeBeansIn = d.cumulativeBeansIn;
      this.cumulativeBeansOut = d.cumulativeBeansOut;
      this.cumulativeProtocolBeansNet = d.cumulativeProtocolBeansNet;
      this.cumulativeProtocolBeansIn = d.cumulativeProtocolBeansIn;
      this.cumulativeProtocolBeansOut = d.cumulativeProtocolBeansOut;
      this.deltaBeansNet = d.deltaBeansNet;
      this.deltaBeansIn = d.deltaBeansIn;
      this.deltaBeansOut = d.deltaBeansOut;
      this.deltaProtocolBeansNet = d.deltaProtocolBeansNet;
      this.deltaProtocolBeansIn = d.deltaProtocolBeansIn;
      this.deltaProtocolBeansOut = d.deltaProtocolBeansOut;
      this.cumulativeUsdNet = d.cumulativeUsdNet;
      this.cumulativeUsdIn = d.cumulativeUsdIn;
      this.cumulativeUsdOut = d.cumulativeUsdOut;
      this.cumulativeProtocolUsdNet = d.cumulativeProtocolUsdNet;
      this.cumulativeProtocolUsdIn = d.cumulativeProtocolUsdIn;
      this.cumulativeProtocolUsdOut = d.cumulativeProtocolUsdOut;
      this.deltaUsdNet = d.deltaUsdNet;
      this.deltaUsdIn = d.deltaUsdIn;
      this.deltaUsdOut = d.deltaUsdOut;
      this.deltaProtocolUsdNet = d.deltaProtocolUsdNet;
      this.deltaProtocolUsdIn = d.deltaProtocolUsdIn;
      this.deltaProtocolUsdOut = d.deltaProtocolUsdOut;
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
