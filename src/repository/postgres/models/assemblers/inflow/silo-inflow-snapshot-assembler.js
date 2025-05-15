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
      deltaBdvNet: snapshotDto.deltaBdvNet,
      deltaBdvIn: snapshotDto.deltaBdvIn,
      deltaBdvOut: snapshotDto.deltaBdvOut,
      cumulativeUsdNet: snapshotDto.cumulativeUsdNet,
      cumulativeUsdIn: snapshotDto.cumulativeUsdIn,
      cumulativeUsdOut: snapshotDto.cumulativeUsdOut,
      deltaUsdNet: snapshotDto.deltaUsdNet,
      deltaUsdIn: snapshotDto.deltaUsdIn,
      deltaUsdOut: snapshotDto.deltaUsdOut
    };
  }

  static fromModel(snapshotModel) {
    return SiloInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = SiloInflowSnapshotAssembler;
