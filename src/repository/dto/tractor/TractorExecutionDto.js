class TractorExecutionDto {
  constructor(type, d) {
    if (type === 'evt') {
      const { tractorEvent: e, receipt, gasUsed, ethPriceUsd } = d;
      this.blueprintHash = e.args.blueprintHash;
      this.nonce = BigInt(e.args.nonce ?? 55); // TODO: this wont work unless the event gets updated to include the nonce
      this.operator = e.args.operator;
      // TODO: the types are definitely incorrect here.
      this.gasCostUsd = ethPriceUsd * gasUsed * receipt.effectiveGasPrice;
      this.tipUsd = null; // Will be updated later if this is a known blueprint and supports tips
      this.executedTimestamp = null; // Needs async, will be set outside
      this.executedBlock = e.rawLog.blockNumber;
      this.executedTxn = e.rawLog.transactionHash;
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

  static async fromTractorEvtContext(tractorEvtContext) {
    const executionDto = new TractorExecutionDto('evt', tractorEvtContext);
    const block = await C().RPC.getBlock(executionDto.executedBlock);
    executionDto.executedTimestamp = new Date(block.timestamp * 1000);
    return executionDto;
  }

  static fromModel(dbModel) {
    return new TractorExecutionDto('db', dbModel);
  }
}

module.exports = TractorExecutionDto;
