const ConvertUpV0OrderDto = require('../../../../dto/tractor/ConvertUpV0OrderDto');

class ConvertUpV0OrderAssembler {
  static toModel(orderDto) {
    return {
      blueprintHash: orderDto.blueprintHash,
      lastExecutedTimestamp: orderDto.lastExecutedTimestamp.getTime() / 1000,
      bdvLeftToConvert: orderDto.bdvLeftToConvert,
      orderComplete: orderDto.orderComplete,
      amountFunded: orderDto.amountFunded,
      cascadeAmountFunded: orderDto.cascadeAmountFunded,
      sourceTokenIndices: orderDto.sourceTokenIndices.join(','),
      totalConvertBdv: orderDto.totalConvertBdv,
      minConvertBdvPerExecution: orderDto.minConvertBdvPerExecution,
      maxConvertBdvPerExecution: orderDto.maxConvertBdvPerExecution,
      minTimeBetweenConverts: orderDto.minTimeBetweenConverts,
      minConvertBonusCapacity: orderDto.minConvertBonusCapacity,
      maxGrownStalkPerBdv: orderDto.maxGrownStalkPerBdv,
      minGrownStalkPerBdvBonus: orderDto.minGrownStalkPerBdvBonus,
      maxPriceToConvertUp: orderDto.maxPriceToConvertUp,
      minPriceToConvertUp: orderDto.minPriceToConvertUp,
      maxGrownStalkPerBdvPenalty: orderDto.maxGrownStalkPerBdvPenalty,
      slippageRatio: orderDto.slippageRatio,
      lowStalkDeposits: orderDto.lowStalkDeposits
    };
  }

  static fromModel(orderModel) {
    return ConvertUpV0OrderDto.fromModel(orderModel);
  }
}
module.exports = ConvertUpV0OrderAssembler;
