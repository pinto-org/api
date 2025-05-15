const SiloInflowSnapshotDto = require('../../../../dto/inflow/SiloInflowSnapshotDto');

class SiloInflowSnapshotAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      cumulativeBdv: snapshotDto.cumulativeBdv,
      deltaBdv: snapshotDto.deltaBdv,
      cumulativeUsd: snapshotDto.cumulativeUsd,
      deltaUsd: snapshotDto.deltaUsd
    };
  }

  static fromModel(snapshotModel) {
    return SiloInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = SiloInflowSnapshotAssembler;
