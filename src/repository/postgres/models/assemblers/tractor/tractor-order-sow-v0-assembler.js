const SowV0OrderDto = require('../../../../dto/tractor/SowV0OrderDto');

class SowOrderV0Assembler {
  static toModel(orderDto) {
    return {
      blueprintHash: orderDto.blueprintHash,
      pintoSownCounter: orderDto.pintoSownCounter,
      lastExecutedSeason: orderDto.lastExecutedSeason,
      orderComplete: orderDto.orderComplete,
      amountFunded: orderDto.amountFunded,
      cascadeAmountFunded: orderDto.cascadeAmountFunded,
      sourceTokenIndices: orderDto.sourceTokenIndices.join(','),
      totalAmountToSow: orderDto.totalAmountToSow,
      minAmountToSowPerSeason: orderDto.minAmountToSowPerSeason,
      maxAmountToSowPerSeason: orderDto.maxAmountToSowPerSeason,
      minTemp: orderDto.minTemp,
      maxPodlineLength: orderDto.maxPodlineLength,
      maxGrownStalkPerBdv: orderDto.maxGrownStalkPerBdv,
      runBlocksAfterSunrise: orderDto.runBlocksAfterSunrise,
      slippageRatio: orderDto.slippageRatio
    };
  }

  static fromModel(orderModel) {
    return SowV0OrderDto.fromModel(orderModel);
  }
}

module.exports = SowOrderV0Assembler;
