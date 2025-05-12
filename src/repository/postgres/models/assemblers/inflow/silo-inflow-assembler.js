const SiloInflowDto = require('../../../../dto/inflow/SiloInflowDto');

class SiloInflowAssembler {
  static toModel(inflowDto) {
    return {
      id: inflowDto.id,
      account: inflowDto.account,
      token: inflowDto.token,
      amount: inflowDto.amount,
      bdv: inflowDto.bdv,
      usd: inflowDto.usd,
      isLp: inflowDto.isLp,
      isTransfer: inflowDto.isTransfer,
      isPlenty: inflowDto.isPlenty,
      block: inflowDto.block,
      timestamp: inflowDto.timestamp,
      txnHash: inflowDto.txnHash
    };
  }

  static fromModel(inflowModel) {
    return SiloInflowDto.fromModel(inflowModel);
  }
}

module.exports = SiloInflowAssembler;
