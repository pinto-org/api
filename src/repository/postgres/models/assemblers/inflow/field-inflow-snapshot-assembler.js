const FieldInflowSnapshotDto = require('../../../../dto/inflow/FieldInflowSnapshotDto');

class FieldInflowSnapshotAssembler {
  static toModel(snapshotDto) {
    return {
      id: snapshotDto.id,
      snapshotTimestamp: snapshotDto.snapshotTimestamp,
      snapshotBlock: snapshotDto.snapshotBlock,
      season: snapshotDto.season,
      cumulativeBeansNet: snapshotDto.cumulativeBeansNet,
      cumulativeBeansIn: snapshotDto.cumulativeBeansIn,
      cumulativeBeansOut: snapshotDto.cumulativeBeansOut,
      deltaBeansNet: snapshotDto.deltaBeansNet,
      deltaBeansIn: snapshotDto.deltaBeansIn,
      deltaBeansOut: snapshotDto.deltaBeansOut,
      cumulativeUsdNet: snapshotDto.cumulativeUsdNet,
      cumulativeUsdIn: snapshotDto.cumulativeUsdIn,
      cumulativeUsdOut: snapshotDto.cumulativeUsdOut,
      deltaUsdNet: snapshotDto.deltaUsdNet,
      deltaUsdIn: snapshotDto.deltaUsdIn,
      deltaUsdOut: snapshotDto.deltaUsdOut
    };
  }

  static fromModel(snapshotModel) {
    return FieldInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = FieldInflowSnapshotAssembler;
