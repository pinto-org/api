const { C } = require('../../../constants/runtime-constants');
const { intToStalkMode } = require('../../postgres/models/types/types');

class ConvertUpOrderDto {
  constructor(type, d) {
    if (type === 'data') {
      const { blueprintHash, blueprintVersion, callArgs } = d;
      this.blueprintHash = blueprintHash;
      this.blueprintVersion = blueprintVersion;

      const convertUpParams = callArgs.params.convertUpParams;

      this.lastExecutedTimestamp = new Date(0);
      this.beansLeftToConvert = convertUpParams.totalBeanAmountToConvert;
      this.orderComplete = false;
      this.amountFunded = 0n;
      this.cascadeAmountFunded = 0n;
      this.sourceTokenIndices = Array.from(convertUpParams.sourceTokenIndices);
      this.totalBeanAmountToConvert = convertUpParams.totalBeanAmountToConvert;
      this.minBeansConvertPerExecution = convertUpParams.minBeansConvertPerExecution;
      this.maxBeansConvertPerExecution = convertUpParams.maxBeansConvertPerExecution;
      this.capAmountToBonusCapacity = convertUpParams.capAmountToBonusCapacity;
      this.minTimeBetweenConverts = convertUpParams.minTimeBetweenConverts;
      this.minConvertBonusCapacity = convertUpParams.minConvertBonusCapacity;
      this.maxGrownStalkPerBdv = convertUpParams.maxGrownStalkPerBdv;
      this.seedDifference = convertUpParams.seedDifference;
      this.grownStalkPerBdvBonusBid = convertUpParams.grownStalkPerBdvBonusBid;
      this.maxPriceToConvertUp = convertUpParams.maxPriceToConvertUp;
      this.minPriceToConvertUp = convertUpParams.minPriceToConvertUp;
      this.maxGrownStalkPerBdvPenalty = convertUpParams.maxGrownStalkPerBdvPenalty;
      this.slippageRatio = convertUpParams.slippageRatio;
      this.lowStalkDeposits = intToStalkMode(Number(convertUpParams.lowStalkDeposits));
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      this.lastExecutedTimestamp = new Date(d.lastExecutedTimestamp * 1000);
      this.beansLeftToConvert = d.beansLeftToConvert;
      this.orderComplete = d.orderComplete;
      this.amountFunded = d.amountFunded;
      this.cascadeAmountFunded = d.cascadeAmountFunded;
      this.sourceTokenIndices = d.sourceTokenIndices.split(',').map(Number);
      this.totalBeanAmountToConvert = d.totalBeanAmountToConvert;
      this.minBeansConvertPerExecution = d.minBeansConvertPerExecution;
      this.maxBeansConvertPerExecution = d.maxBeansConvertPerExecution;
      this.capAmountToBonusCapacity = d.capAmountToBonusCapacity;
      this.minTimeBetweenConverts = d.minTimeBetweenConverts;
      this.minConvertBonusCapacity = d.minConvertBonusCapacity;
      this.maxGrownStalkPerBdv = d.maxGrownStalkPerBdv;
      this.seedDifference = d.seedDifference;
      this.grownStalkPerBdvBonusBid = d.grownStalkPerBdvBonusBid;
      this.maxPriceToConvertUp = d.maxPriceToConvertUp;
      this.minPriceToConvertUp = d.minPriceToConvertUp;
      this.maxGrownStalkPerBdvPenalty = d.maxGrownStalkPerBdvPenalty;
      this.slippageRatio = d.slippageRatio;
      this.lowStalkDeposits = d.lowStalkDeposits;
    }
  }

  static fromBlueprintCalldata(blueprintData) {
    return new ConvertUpOrderDto('data', blueprintData);
  }

  static fromModel(dbModel) {
    return new ConvertUpOrderDto('db', dbModel);
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

  canExecuteThisSeason({ currentPrice, bonusStalkPerBdv, maxSeasonalCapacity }) {
    return (
      maxSeasonalCapacity >= this.minConvertBonusCapacity &&
      bonusStalkPerBdv >= this.grownStalkPerBdvBonusBid &&
      currentPrice >= this.minPriceToConvertUp &&
      currentPrice <= this.maxPriceToConvertUp
    );
  }
}

module.exports = ConvertUpOrderDto;
