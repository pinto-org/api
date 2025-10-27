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
      cumulativeProtocolBeansNet: snapshotDto.cumulativeProtocolBeansNet,
      cumulativeProtocolBeansIn: snapshotDto.cumulativeProtocolBeansIn,
      cumulativeProtocolBeansOut: snapshotDto.cumulativeProtocolBeansOut,
      deltaBeansNet: snapshotDto.deltaBeansNet,
      deltaBeansIn: snapshotDto.deltaBeansIn,
      deltaBeansOut: snapshotDto.deltaBeansOut,
      deltaProtocolBeansNet: snapshotDto.deltaProtocolBeansNet,
      deltaProtocolBeansIn: snapshotDto.deltaProtocolBeansIn,
      deltaProtocolBeansOut: snapshotDto.deltaProtocolBeansOut,
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
    return FieldInflowSnapshotDto.fromModel(snapshotModel);
  }
}

module.exports = FieldInflowSnapshotAssembler;
