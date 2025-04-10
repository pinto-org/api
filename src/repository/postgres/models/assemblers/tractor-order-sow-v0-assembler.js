const SowOrderV0Dto = require('../../../dto/tractor/SowOrderV0Dto');

class SowOrderV0Assembler {
  static toModel(orderDto) {
    return {
      id: orderDto.id,
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
    return SowOrderV0Dto.fromModel(orderModel);
  }
}
module.exports = SowOrderV0Assembler;
