const FieldInflowDto = require('../../../../dto/inflow/FieldInflowDto');

class FieldInflowAssembler {
  static toModel(fieldInflowDto) {
    return {
      id: fieldInflowDto.id,
      account: fieldInflowDto.account,
      amount: fieldInflowDto.amount,
      usd: fieldInflowDto.usd,
      isMarket: fieldInflowDto.isMarket,
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
