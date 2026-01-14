const ConvertUpOrderDto = require('../../../../dto/tractor/ConvertUpOrderDto');

class ConvertUpOrderAssembler {
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
    return ConvertUpOrderDto.fromModel(orderModel);
  }
}
module.exports = ConvertUpOrderAssembler;
