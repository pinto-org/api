const SiloInflowSnapshotDto = require('../../../../dto/inflow/SiloInflowSnapshotDto');

class SiloInflowSnapshotAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      cumulativeBdvNet: snapshotDto.cumulativeBdvNet,
      cumulativeBdvIn: snapshotDto.cumulativeBdvIn,
      cumulativeBdvOut: snapshotDto.cumulativeBdvOut,
      cumulativeProtocolBdvNet: snapshotDto.cumulativeProtocolBdvNet,
      cumulativeProtocolBdvIn: snapshotDto.cumulativeProtocolBdvIn,
      cumulativeProtocolBdvOut: snapshotDto.cumulativeProtocolBdvOut,
      deltaBdvNet: snapshotDto.deltaBdvNet,
      deltaBdvIn: snapshotDto.deltaBdvIn,
      deltaBdvOut: snapshotDto.deltaBdvOut,
      deltaProtocolBdvNet: snapshotDto.deltaProtocolBdvNet,
      deltaProtocolBdvIn: snapshotDto.deltaProtocolBdvIn,
      deltaProtocolBdvOut: snapshotDto.deltaProtocolBdvOut,
      cumulativeUsdNet: snapshotDto.cumulativeUsdNet,
      cumulativeUsdIn: snapshotDto.cumulativeUsdIn,
      cumulativeUsdOut: snapshotDto.cumulativeUsdOut,
      cumulativeProtocolUsdNet: snapshotDto.cumulativeProtocolUsdNet,
      cumulativeProtocolUsdIn: snapshotDto.cumulativeProtocolUsdIn,
      cumulativeProtocolUsdOut: snapshotDto.cumulativeProtocolUsdOut,
      deltaUsdNet: snapshotDto.deltaUsdNet,
      deltaUsdIn: snapshotDto.deltaUsdIn,
      deltaUsdOut: snapshotDto.deltaUsdOut,
      deltaProtocolUsdNet: snapshotDto.deltaProtocolUsdNet,
      deltaProtocolUsdIn: snapshotDto.deltaProtocolUsdIn,
      deltaProtocolUsdOut: snapshotDto.deltaProtocolUsdOut
    };
  }

  static fromModel(snapshotModel) {
    return SiloInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = SiloInflowSnapshotAssembler;
