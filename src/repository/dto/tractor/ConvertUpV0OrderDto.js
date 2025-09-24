const { C } = require('../../../constants/runtime-constants');
const { intToStalkMode } = require('../../postgres/models/types/types');

class ConvertUpV0OrderDto {
  constructor(type, d) {
    if (type === 'data') {
      this.blueprintHash = d.blueprintHash;
      this.lastExecutedTimestamp = new Date(0);
      this.beansLeftToConvert = d.convertUpParams.totalBeanAmountToConvert;
      this.orderComplete = false;
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
      this.sourceTokenIndices = Array.from(d.convertUpParams.sourceTokenIndices);
      this.totalBeanAmountToConvert = d.convertUpParams.totalBeanAmountToConvert;
      this.minBeansConvertPerExecution = d.convertUpParams.minBeansConvertPerExecution;
      this.maxBeansConvertPerExecution = d.convertUpParams.maxBeansConvertPerExecution;
      this.minTimeBetweenConverts = d.convertUpParams.minTimeBetweenConverts;
      this.minConvertBonusCapacity = d.convertUpParams.minConvertBonusCapacity;
      this.maxGrownStalkPerBdv = d.convertUpParams.maxGrownStalkPerBdv;
      this.grownStalkPerBdvBonusBid = d.convertUpParams.grownStalkPerBdvBonusBid;
      this.maxPriceToConvertUp = d.convertUpParams.maxPriceToConvertUp;
      this.minPriceToConvertUp = d.convertUpParams.minPriceToConvertUp;
      this.maxGrownStalkPerBdvPenalty = d.convertUpParams.maxGrownStalkPerBdvPenalty;
      this.slippageRatio = d.convertUpParams.slippageRatio;
      this.lowStalkDeposits = intToStalkMode(Number(d.convertUpParams.lowStalkDeposits));
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      this.lastExecutedTimestamp = new Date(d.lastExecutedTimestamp * 1000);
      this.beansLeftToConvert = d.beansLeftToConvert;
      this.orderComplete = d.orderComplete;
      this.amountFunded = d.amountFunded;
      this.cascadeAmountFunded = d.cascadeAmountFunded;
      this.sourceTokenIndices = d.sourceTokenIndices.split(',');
      this.totalBeanAmountToConvert = d.totalBeanAmountToConvert;
      this.minBeansConvertPerExecution = d.minBeansConvertPerExecution;
      this.maxBeansConvertPerExecution = d.maxBeansConvertPerExecution;
      this.minTimeBetweenConverts = d.minTimeBetweenConverts;
      this.minConvertBonusCapacity = d.minConvertBonusCapacity;
      this.maxGrownStalkPerBdv = d.maxGrownStalkPerBdv;
      this.grownStalkPerBdvBonusBid = d.grownStalkPerBdvBonusBid;
      this.maxPriceToConvertUp = d.maxPriceToConvertUp;
      this.minPriceToConvertUp = d.minPriceToConvertUp;
      this.maxGrownStalkPerBdvPenalty = d.maxGrownStalkPerBdvPenalty;
      this.slippageRatio = d.slippageRatio;
      this.lowStalkDeposits = d.lowStalkDeposits;
    }
  }

  static fromBlueprintCalldata(blueprintData) {
    return new ConvertUpV0OrderDto('data', blueprintData);
  }

  static fromModel(dbModel) {
    return new ConvertUpV0OrderDto('db', dbModel);
  }

  async updateFieldsUponExecution(executionEvents) {
    // There can be potentially multiple Convert events (for different tokens)
    const convertEvts = executionEvents.filter((e) => e.name === 'Convert');
    this.beansLeftToConvert =
      this.beansLeftToConvert - convertEvts.reduce((acc, next) => acc + BigInt(next.args.toAmount), 0n);
    this.lastExecutedTimestamp = new Date((await C().RPC.getBlock(convertEvts[0].rawLog.blockNumber)).timestamp * 1000);
    this.orderComplete = !!executionEvents.find((e) => e.name === 'ConvertUpOrderComplete');
    if (this.orderComplete) {
      // Funding amounts could remain nonzero if there is capacity under the minimum amount to sow.
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
    }
  }
}

module.exports = ConvertUpV0OrderDto;
