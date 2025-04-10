class SowOrderV0Dto {
  constructor(type, d) {
    // exmaple access: d.args.params.sowParams.minTemp
    if (type === 'data') {
      // TODO: this.order?
      this.pintoSownCounter = 0n;
      this.lastExecutedSeason = 0;
      this.orderComplete = false;
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
      this.sourceTokenIndices = Array.from(d.args.params.sowParams.sourceTokenIndices);
      this.totalAmountToSow = d.args.params.sowParams.sowAmounts.totalAmountToSow;
      this.minAmountToSowPerSeason = d.args.params.sowParams.sowAmounts.minAmountToSowPerSeason;
      this.maxAmountToSowPerSeason = d.args.params.sowParams.sowAmounts.maxAmountToSowPerSeason;
      this.minTemp = d.args.params.sowParams.minTemp;
      this.maxPodlineLength = d.args.params.sowParams.maxPodlineLength;
      this.maxGrownStalkPerBdv = d.args.params.sowParams.maxGrownStalkPerBdv;
      this.runBlocksAfterSunrise = d.args.params.sowParams.runBlocksAfterSunrise;
      this.slippageRatio = d.args.params.sowParams.slippageRatio;
    } else if (type === 'db') {
      this.id = d.id;
    }
  }

  static async fromBlueprintCalldata(blueprintData) {
    return new SowOrderV0Dto('data', blueprintData);
  }

  static fromModel(dbModel) {
    return new SowOrderV0Dto('db', dbModel);
  }
}
module.exports = SowOrderV0Dto;
