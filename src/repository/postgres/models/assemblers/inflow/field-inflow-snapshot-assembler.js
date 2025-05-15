const FieldInflowSnapshotDto = require('../../../../dto/inflow/FieldInflowSnapshotDto');

class FieldInflowSnapshotAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      cumulativeBeans: snapshotDto.cumulativeBeans,
      deltaBeans: snapshotDto.deltaBeans,
      cumulativeUsd: snapshotDto.cumulativeUsd,
      deltaUsd: snapshotDto.deltaUsd
    };
  }

  static fromModel(snapshotModel) {
    return FieldInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = FieldInflowSnapshotAssembler;
