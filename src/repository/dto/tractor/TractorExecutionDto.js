const { C } = require('../../../constants/runtime-constants');
const { effectiveGasPriceBI } = require('../../../datasources/rpc-discrepancies');
const { fromBigInt } = require('../../../utils/number');

class TractorExecutionDto {
  constructor(type, d) {
    if (type === 'evt') {
      const { tractorEvent: e, receipt, gasUsed, ethPriceUsd } = d;
      this.blueprintHash = e.args.blueprintHash;
      this.nonce = BigInt(e.args.nonce);
      this.operator = e.args.operator;
      this.gasCostUsd = ethPriceUsd * gasUsed * fromBigInt(effectiveGasPriceBI(receipt), 18);
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

      if (d.TractorOrder) {
        this.orderInfo = {
          orderType: d.TractorOrder.orderType,
          publisher: d.TractorOrder.publisher
        };
      }
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
