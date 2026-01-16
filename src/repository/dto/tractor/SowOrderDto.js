const Contracts = require('../../../datasources/contracts/contracts');

class SowOrderDto {
  constructor(type, d) {
    if (type === 'data') {
      const { blueprintHash, blueprintVersion, callArgs } = d;
      this.blueprintHash = blueprintHash;
      this.blueprintVersion = blueprintVersion;

      this.pintoSownCounter = 0n;
      this.lastExecutedSeason = 0;
      this.orderComplete = false;
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;

      const sowParams = blueprintVersion === 'V0' ? callArgs.params.sowParams : callArgs.params.params.sowParams;

      this.sourceTokenIndices = Array.from(sowParams.sourceTokenIndices);
      this.totalAmountToSow = sowParams.sowAmounts.totalAmountToSow;
      this.minAmountToSowPerSeason = sowParams.sowAmounts.minAmountToSowPerSeason;
      this.maxAmountToSowPerSeason = sowParams.sowAmounts.maxAmountToSowPerSeason;
      this.minTemp = sowParams.minTemp;
      this.maxPodlineLength = sowParams.maxPodlineLength;
      this.maxGrownStalkPerBdv = sowParams.maxGrownStalkPerBdv;
      this.runBlocksAfterSunrise = sowParams.runBlocksAfterSunrise;
      this.slippageRatio = sowParams.slippageRatio;
      this.referralAddress = blueprintVersion === 'REFERRAL' ? callArgs.params.referral : null;
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      this.blueprintVersion = d.blueprintVersion;
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
      this.referralAddress = d.referralAddress;
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
