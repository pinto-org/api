const Contracts = require('../../../datasources/contracts/contracts');

class SowOrderDto {
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
      this.blueprintHash = d.blueprintHash;
      this.pintoSownCounter = d.pintoSownCounter;
      this.lastExecutedSeason = d.lastExecutedSeason;
      this.orderComplete = d.orderComplete;
      this.amountFunded = d.amountFunded;
      this.cascadeAmountFunded = d.cascadeAmountFunded;
      this.sourceTokenIndices = d.sourceTokenIndices.split(',').map(Number);
      this.totalAmountToSow = d.totalAmountToSow;
      this.minAmountToSowPerSeason = d.minAmountToSowPerSeason;
      this.maxAmountToSowPerSeason = d.maxAmountToSowPerSeason;
      this.minTemp = d.minTemp;
      this.maxPodlineLength = d.maxPodlineLength;
      this.maxGrownStalkPerBdv = d.maxGrownStalkPerBdv;
      this.runBlocksAfterSunrise = d.runBlocksAfterSunrise;
      this.slippageRatio = d.slippageRatio;
    }
  }

  static fromBlueprintCalldata(blueprintData) {
    return new SowOrderDto('data', blueprintData);
  }

  static fromModel(dbModel) {
    return new SowOrderDto('db', dbModel);
  }

  async updateFieldsUponExecution(executionEvents) {
    const sowEvt = executionEvents.find((e) => e.name === 'Sow');
    this.pintoSownCounter += BigInt(sowEvt.args.beans);
    this.lastExecutedSeason = Number(await Contracts.getBeanstalk().season({ blockTag: sowEvt.rawLog.blockNumber }));
    this.orderComplete = !!executionEvents.find((e) => e.name === 'SowOrderComplete');
    if (this.orderComplete) {
      // Funding amounts could remain nonzero if there is capacity under the minimum amount to sow.
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
    }
  }

  canExecuteThisSeason({ maxTemperature, podlineLength }) {
    return maxTemperature >= this.minTemp && podlineLength <= this.maxPodlineLength;
  }
}

module.exports = SowOrderDto;
