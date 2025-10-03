const ConvertUpV0OrderDto = require('../../../../dto/tractor/ConvertUpV0OrderDto');

class ConvertUpV0OrderAssembler {
  static toModel(orderDto) {
    return {
      blueprintHash: orderDto.blueprintHash,
      lastExecutedTimestamp: orderDto.lastExecutedTimestamp.getTime() / 1000,
      beansLeftToConvert: orderDto.beansLeftToConvert,
      orderComplete: orderDto.orderComplete,
      amountFunded: orderDto.amountFunded,
      cascadeAmountFunded: orderDto.cascadeAmountFunded,
      sourceTokenIndices: orderDto.sourceTokenIndices.join(','),
      totalBeanAmountToConvert: orderDto.totalBeanAmountToConvert,
      minBeansConvertPerExecution: orderDto.minBeansConvertPerExecution,
      maxBeansConvertPerExecution: orderDto.maxBeansConvertPerExecution,
      capAmountToBonusCapacity: orderDto.capAmountToBonusCapacity,
      minTimeBetweenConverts: orderDto.minTimeBetweenConverts,
      minConvertBonusCapacity: orderDto.minConvertBonusCapacity,
      maxGrownStalkPerBdv: orderDto.maxGrownStalkPerBdv,
      grownStalkPerBdvBonusBid: orderDto.grownStalkPerBdvBonusBid,
      maxPriceToConvertUp: orderDto.maxPriceToConvertUp,
      minPriceToConvertUp: orderDto.minPriceToConvertUp,
      seedDifference: orderDto.seedDifference,
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
