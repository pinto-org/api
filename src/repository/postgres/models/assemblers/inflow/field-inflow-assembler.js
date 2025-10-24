const FieldInflowDto = require('../../../../dto/inflow/FieldInflowDto');

class FieldInflowAssembler {
  static toModel(fieldInflowDto) {
    return {
      id: fieldInflowDto.id,
      account: fieldInflowDto.account,
      beans: fieldInflowDto.beans,
      usd: fieldInflowDto.usd,
      isMarket: fieldInflowDto.isMarket,
      accountSiloNegationBdv: fieldInflowDto.accountSiloNegationBdv,
      accountSiloNegationUsd: fieldInflowDto.accountSiloNegationUsd,
      protocolSiloNegationBdv: fieldInflowDto.protocolSiloNegationBdv,
      protocolSiloNegationUsd: fieldInflowDto.protocolSiloNegationUsd,
      block: fieldInflowDto.block,
      timestamp: fieldInflowDto.timestamp,
      txnHash: fieldInflowDto.txnHash
    };
  }

  static fromModel(fieldInflowModel) {
    return FieldInflowDto.fromModel(fieldInflowModel);
  }
}

module.exports = FieldInflowAssembler;
