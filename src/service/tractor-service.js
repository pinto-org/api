const { sequelize } = require('../repository/postgres/models');
const TractorExecutionAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-execution-assembler');
const SowV0ExecutionAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-execution-sow-v0-assembler');
const TractorOrderAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-order-assembler');
const SowV0OrderAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-order-sow-v0-assembler');
const SharedService = require('./shared-service');

class TractorService {
  // Via upsert
  static async updateOrders(orderDtos) {
    SharedService.genericEntityUpdate(orderDtos, sequelize.models.TractorOrder, TractorOrderAssembler, true);
  }

  // Via upsert
  static async updateExecutions(executionDtos) {
    SharedService.genericEntityUpdate(
      executionDtos,
      sequelize.models.TractorExecution,
      TractorExecutionAssembler,
      true
    );
  }

  // Via upsert
  static async updateSowV0Orders(orderDtos) {
    SharedService.genericEntityUpdate(orderDtos, sequelize.models.TractorOrderSowV0, SowV0OrderAssembler, true);
  }

  // Via upsert
  static async updateSowV0Executions(executionDtos) {
    SharedService.genericEntityUpdate(
      executionDtos,
      sequelize.models.TractorExecutionSowV0,
      SowV0ExecutionAssembler,
      true
    );
  }
}
module.exports = TractorService;
