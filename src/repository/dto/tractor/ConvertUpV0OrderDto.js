class ConvertUpV0OrderDto {
  constructor(type, d) {
    if (type === 'data') {
      this.blueprintHash = d.blueprintHash;
      // TBD
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      this.lastExecutedTimestamp = new Date(d.lastExecutedTimestamp * 1000);
      this.bdvLeftToConvert = d.bdvLeftToConvert;
      this.orderComplete = d.orderComplete;
      // Funding amount fields TBD
      this.sourceTokenIndices = d.sourceTokenIndices.split(',');
      this.totalConvertBdv = d.totalConvertBdv;
      this.minConvertBdvPerExecution = d.minConvertBdvPerExecution;
      this.maxConvertBdvPerExecution = d.maxConvertBdvPerExecution;
      this.minTimeBetweenConverts = d.minTimeBetweenConverts;
      this.minConvertBonusCapacity = d.minConvertBonusCapacity;
      this.maxGrownStalkPerBdv = d.maxGrownStalkPerBdv;
      this.minGrownStalkPerBdvBonus = d.minGrownStalkPerBdvBonus;
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
    throw new Error('Not implemented');
  }
}

module.exports = ConvertUpV0OrderDto;
