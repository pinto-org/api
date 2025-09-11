const { TractorOrderType } = require('../../../repository/postgres/models/types/types');
const Blueprint = require('./blueprint');
const { sequelize } = require('../../../repository/postgres/models');
const ConvertUpV0ExecutionDto = require('../../../repository/dto/tractor/ConvertUpV0ExecutionDto');
const ConvertUpV0OrderAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-order-convert-up-v0-assembler');
const ConvertUpV0ExecutionAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-execution-convert-up-v0-assembler');

class TractorConvertUpV0Service extends Blueprint {
  static orderType = TractorOrderType.CONVERT_UP_V0;
  static orderModel = sequelize.models.TractorOrderConvertUpV0;
  static orderAssembler = ConvertUpV0OrderAssembler;
  static executionModel = sequelize.models.TractorExecutionConvertUpV0;
  static executionAssembler = ConvertUpV0ExecutionAssembler;
  static executionDto = ConvertUpV0ExecutionDto;

  // Behavior TBD
  static async periodicUpdate(TractorService_getOrders, blockNumber) {
    //
  }

  static async tryAddRequisition(orderDto, blueprintData) {
    // Cant write this until we have a blueprint to test with
  }

  static async orderCancelled(orderDto) {
    //
  }

  static decodeBlueprintData(blueprintData) {
    //
  }

  static validateOrderParams(blueprintParams) {
    //
  }

  static orderRequestParams(blueprintParams) {
    //
  }

  static validateExecutionParams(blueprintParams) {
    //
  }

  static executionRequestParams(blueprintParams) {
    //
  }
}
module.exports = TractorConvertUpV0Service;
