class SowOrderV0Dto {
  constructor(type, d) {
    if (type === 'data') {
      this.blueprintHash = d.blueprintHash;
      this.pintoSownCounter = 0n;
      this.lastExecutedSeason = 0;
      this.orderComplete = false;
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
      this.sourceTokenIndices = Array.from(d.sowParams.sourceTokenIndices);
      this.totalAmountToSow = d.sowParams.sowAmounts.totalAmountToSow;
      this.minAmountToSowPerSeason = d.sowParams.sowAmounts.minAmountToSowPerSeason;
      this.maxAmountToSowPerSeason = d.sowParams.sowAmounts.maxAmountToSowPerSeason;
      this.minTemp = d.sowParams.minTemp;
      this.maxPodlineLength = d.sowParams.maxPodlineLength;
      this.maxGrownStalkPerBdv = d.sowParams.maxGrownStalkPerBdv;
      this.runBlocksAfterSunrise = d.sowParams.runBlocksAfterSunrise;
      this.slippageRatio = d.sowParams.slippageRatio;
    } else if (type === 'db') {
      this.id = d.id;
    }
  }

  static fromBlueprintCalldata(blueprintData) {
    return new SowOrderV0Dto('data', blueprintData);
  }

  static fromModel(dbModel) {
    return new SowOrderV0Dto('db', dbModel);
  }
}
module.exports = SowOrderV0Dto;
