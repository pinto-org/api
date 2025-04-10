const { C } = require('../../../constants/runtime-constants');

class TractorOrderDto {
  constructor(type, d) {
    if (type === 'evt') {
      this.blueprintHash = d.args.requisition.blueprintHash;
      this.orderType = null; // Will be updated later if this is a known blueprint
      this.publisher = d.args.requisition.blueprint.publisher;
      this.data = d.args.requisition.blueprint.data;
      this.operatorPasteInstrs = d.args.requisition.blueprint.operatorPasteInstrs;
      this.maxNonce = BigInt(d.args.requisition.blueprint.maxNonce);
      this.startTime = TractorOrderDto._safeDate(BigInt(d.args.requisition.blueprint.startTime));
      this.endTime = TractorOrderDto._safeDate(BigInt(d.args.requisition.blueprint.endTime));
      this.signature = d.args.requisition.signature;
      this.publishedTimestamp = null; // Needs async, will be set outside
      this.publishedBlock = d.rawLog.blockNumber;
      this.beanTip = null; // Will be updated later if this is a known blueprint and supports tips
    } else if (type === 'db') {
      this.blueprintHash = d.blueprintHash;
      this.orderType = d.orderType;
      this.publisher = d.publisher;
      this.data = d.data;
      this.operatorPasteInstrs = d.operatorPasteInstrs.split(',');
      this.maxNonce = d.maxNonce;
      this.startTime = d.startTime;
      this.endTime = d.endTime;
      this.signature = d.signature;
      this.publishedTimestamp = d.publishedTimestamp;
      this.publishedBlock = d.publishedBlock;
      this.beanTip = d.beanTip;
    }
  }

  static async fromRequisitionEvt(publishRequisitionEvt) {
    const orderDto = new TractorOrderDto('evt', publishRequisitionEvt);
    const block = await C().RPC.getBlock(orderDto.publishedBlock);
    orderDto.publishedTimestamp = new Date(block.timestamp * 1000);
    return orderDto;
  }

  static fromModel(dbModel) {
    return new TractorOrderDto('db', dbModel);
  }

  static _safeDate(bigintSeconds) {
    const date = new Date(Number(bigintSeconds) * 1000);
    return isNaN(date.getTime()) ? new Date(8640000000000000) : date;
  }
}
module.exports = TractorOrderDto;
