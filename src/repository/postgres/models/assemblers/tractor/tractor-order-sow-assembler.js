const SowOrderDto = require('../../../../dto/tractor/SowOrderDto');

class SowOrderAssembler {
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
      slippageRatio: orderDto.slippageRatio,
      referralAddress: orderDto.referralAddress
    };
  }

  static fromModel(orderModel) {
    return SowOrderDto.fromModel(orderModel);
  }
}
module.exports = SowOrderAssembler;
