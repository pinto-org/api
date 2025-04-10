class SowV0ExecutionDto {
  constructor(type, d) {
    if (type === 'data') {
      // this.id = d.id;
      // this.blueprintHash = d.blueprintHash;
      // this.index = BigInt(d.index);
      // this.beans = BigInt(d.beans);
      // this.pods = BigInt(d.pods);
      // this.placeInLine = computed elsewhere
      // this.usedTokenIndices = Array.from(d.usedTokenIndices);
      // this.usedGrownStalkPerBdv = d.usedGrownStalkPerBdv;
    } else if (type === 'db') {
      this.id = d.id;
      this.blueprintHash = d.blueprintHash;
      this.index = d.index;
      this.beans = d.beans;
      this.pods = d.pods;
      this.placeInLine = d.placeInLine;
      this.usedTokenIndices = d.usedTokenIndices.split(',').map(BigInt);
      this.usedGrownStalkPerBdv = d.usedGrownStalkPerBdv;
    }
  }

  static fromExecutionData(executionData) {
    return new SowV0ExecutionDto('data', executionData);
  }

  static fromModel(dbModel) {
    return new SowV0ExecutionDto('db', dbModel);
  }
}

module.exports = SowV0ExecutionDto;
