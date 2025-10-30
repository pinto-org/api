class SiloInflowSnapshotDto {
  constructor(type, d) {
    if (type === 'init') {
      this.snapshotTimestamp = d.timestamp;
      this.snapshotBlock = d.block;
      this.season = d.season;
      this.cumulativeBdvNet = BigInt(d.cumulative_bdv_net ?? 0);
      this.cumulativeBdvIn = BigInt(d.cumulative_bdv_in ?? 0);
      this.cumulativeBdvOut = BigInt(d.cumulative_bdv_out ?? 0);
      this.cumulativeProtocolBdvNet = BigInt(d.cumulative_protocol_bdv_net ?? 0);
      this.cumulativeProtocolBdvIn = BigInt(d.cumulative_protocol_bdv_in ?? 0);
      this.cumulativeProtocolBdvOut = BigInt(d.cumulative_protocol_bdv_out ?? 0);
      this.deltaBdvNet = BigInt(d.delta_bdv_net ?? d.cumulative_bdv_net ?? 0);
      this.deltaBdvIn = BigInt(d.delta_bdv_in ?? d.cumulative_bdv_in ?? 0);
      this.deltaBdvOut = BigInt(d.delta_bdv_out ?? d.cumulative_bdv_out ?? 0);
      this.deltaProtocolBdvNet = BigInt(d.delta_protocol_bdv_net ?? d.cumulative_protocol_bdv_net ?? 0);
      this.deltaProtocolBdvIn = BigInt(d.delta_protocol_bdv_in ?? d.cumulative_protocol_bdv_in ?? 0);
      this.deltaProtocolBdvOut = BigInt(d.delta_protocol_bdv_out ?? d.cumulative_protocol_bdv_out ?? 0);
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
      this.cumulativeBdvNet = d.cumulativeBdvNet;
      this.cumulativeBdvIn = d.cumulativeBdvIn;
      this.cumulativeBdvOut = d.cumulativeBdvOut;
      this.cumulativeProtocolBdvNet = d.cumulativeProtocolBdvNet;
      this.cumulativeProtocolBdvIn = d.cumulativeProtocolBdvIn;
      this.cumulativeProtocolBdvOut = d.cumulativeProtocolBdvOut;
      this.deltaBdvNet = d.deltaBdvNet;
      this.deltaBdvIn = d.deltaBdvIn;
      this.deltaBdvOut = d.deltaBdvOut;
      this.deltaProtocolBdvNet = d.deltaProtocolBdvNet;
      this.deltaProtocolBdvIn = d.deltaProtocolBdvIn;
      this.deltaProtocolBdvOut = d.deltaProtocolBdvOut;
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
    return new SiloInflowSnapshotDto('init', liveSnapshot);
  }

  static fromModel(dbModel) {
    return new SiloInflowSnapshotDto('model', dbModel);
  }
}

module.exports = SiloInflowSnapshotDto;
