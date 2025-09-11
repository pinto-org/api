const ConvertUpV0OrderDto = require('../../../../dto/tractor/ConvertUpV0OrderDto');

class ConvertUpV0OrderAssembler {
  static toModel(orderDto) {
    return {
      blueprintHash: orderDto.blueprintHash
      // TBD
    };
  }

  static fromModel(orderModel) {
    return ConvertUpV0OrderDto.fromModel(orderModel);
  }
}
module.exports = ConvertUpV0OrderAssembler;
