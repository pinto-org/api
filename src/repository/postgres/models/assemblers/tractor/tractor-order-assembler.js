const TractorOrderDto = require('../../../../dto/tractor/TractorOrderDto');

class TractorOrderAssembler {
  static toModel(orderDto) {
    return {
      blueprintHash: orderDto.blueprintHash,
      orderType: orderDto.orderType,
      publisher: orderDto.publisher,
      data: orderDto.data,
      operatorPasteInstrs: orderDto.operatorPasteInstrs.join(','),
      maxNonce: orderDto.maxNonce,
      startTime: orderDto.startTime,
      endTime: orderDto.endTime,
      signature: orderDto.signature,
      publishedTimestamp: orderDto.publishedTimestamp,
      publishedBlock: orderDto.publishedBlock,
      beanTip: orderDto.beanTip
    };
  }

  static fromModel(orderModel) {
    return TractorOrderDto.fromModel(orderModel);
  }
}
module.exports = TractorOrderAssembler;
