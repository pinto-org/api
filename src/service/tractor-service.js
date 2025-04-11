const { sequelize, Sequelize } = require('../repository/postgres/models');
const TractorExecutionAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-execution-assembler');
const SowV0ExecutionAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-execution-sow-v0-assembler');
const TractorOrderAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-order-assembler');
const SowV0OrderAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-order-sow-v0-assembler');
const TractorOrderRepository = require('../repository/postgres/queries/tractor-order-repository');
const AsyncContext = require('../utils/async/context');
const AppMetaService = require('./meta-service');
const SharedService = require('./shared-service');

class TractorService {
  /**
   * @param {import('../../types/types').TractorOrderRequest} request
   * @returns {Promise<import('../../types/types').TractorOrdersResult>}
   */
  static async getOrders(request) {
    // Retrieve all matching orders
    const criteriaList = [];
    if (request.orderType) {
      if (request.orderType === 'KNOWN') {
        criteriaList.push({ orderType: { [Sequelize.Op.ne]: null } });
      } else if (request.orderType === 'UNKNOWN') {
        criteriaList.push({ orderType: null });
      } else {
        criteriaList.push({ orderType: request.orderType });
      }
    }
    request.publisher && criteriaList.push({ publisher: request.publisher });
    if (request.publishedBetween) {
      criteriaList.push({
        publishedTimestamp: {
          $gte: request.publishedBetween[0],
          $lte: request.publishedBetween[1]
        }
      });
    }
    if (request.validBetween) {
      criteriaList.push({
        validUntil: {
          $gte: request.validBetween[0],
          $lte: request.validBetween[1]
        }
      });
    }
    request.limit ??= 100;

    const { orders, total, lastUpdated } = await AsyncContext.sequelizeTransaction(async () => {
      const [{ orders, total }, tractorMeta] = await Promise.all([
        TractorOrderRepository.findAllWithOptions({
          criteriaList,
          ...request
        }),
        AppMetaService.getTractorMeta()
      ]);
      return { orders, total, lastUpdated: tractorMeta.lastUpdate };
    });

    const orderDtos = orders.map((d) => TractorOrderAssembler.fromModel(d));

    // If it is a known blueprint, retrieve the associated order data (batch by order type)
    // .blueprintData = ?

    return {
      lastUpdated,
      orders: orderDtos,
      totalRecords: total
    };
  }

  static async getExecutions(request) {
    // Retrieve all matching executions
    // If it is a known blueprint, retrieve the associated execution data (batch by order type)
    // Assemble to dtos
  }

  // Via upsert
  static async updateOrders(orderDtos) {
    return await SharedService.genericEntityUpdate(
      orderDtos,
      sequelize.models.TractorOrder,
      TractorOrderAssembler,
      true
    );
  }

  // Via upsert
  static async updateExecutions(executionDtos) {
    return await SharedService.genericEntityUpdate(
      executionDtos,
      sequelize.models.TractorExecution,
      TractorExecutionAssembler,
      true
    );
  }

  // Via upsert
  static async updateSowV0Orders(orderDtos) {
    return await SharedService.genericEntityUpdate(
      orderDtos,
      sequelize.models.TractorOrderSowV0,
      SowV0OrderAssembler,
      true
    );
  }

  // Via upsert
  static async updateSowV0Executions(executionDtos) {
    return await SharedService.genericEntityUpdate(
      executionDtos,
      sequelize.models.TractorExecutionSowV0,
      SowV0ExecutionAssembler,
      true
    );
  }
}
module.exports = TractorService;
