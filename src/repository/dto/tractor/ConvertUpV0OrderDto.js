class ConvertUpV0OrderDto {
  constructor(type, d) {
    if (type === 'data') {
      this.blueprintHash = d.blueprintHash;
      // TBD
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      // TBD
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
