class TractorExecutionDto {
  constructor(type, d) {
    if (type === 'evt') {
      // this.blueprintHash = d.args.blueprintHash;
      // this.nonce = BigInt(d.args.nonce);
      // this.operator = d.args.operator;
      // this.gasCostUsd = d.gasCostUsd;
      // this.tipUsd = d.tipUsd;
      // this.executedTimestamp = new Date(d.rawLog.blockTime * 1000);
      // this.executedBlock = d.rawLog.blockNumber;
      // this.executedTxn = d.rawLog.transactionHash;
    } else if (type === 'db') {
      this.id = d.id;
      this.blueprintHash = d.blueprintHash;
      this.nonce = d.nonce;
      this.operator = d.operator;
      this.gasCostUsd = d.gasCostUsd;
      this.tipUsd = d.tipUsd;
      this.executedTimestamp = d.executedTimestamp;
      this.executedBlock = d.executedBlock;
      this.executedTxn = d.executedTxn;
    }
  }

  static fromTractorEvt(tractorEvt) {
    return new TractorExecutionDto('evt', tractorEvt);
  }

  static fromModel(dbModel) {
    return new TractorExecutionDto('db', dbModel);
  }
}

module.exports = TractorExecutionDto;
