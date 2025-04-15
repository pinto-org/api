const TractorConstants = require('../constants/tractor');
const { sequelize, Sequelize } = require('../repository/postgres/models');
const TractorExecutionAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-execution-assembler');
const TractorOrderAssembler = require('../repository/postgres/models/assemblers/tractor/tractor-order-assembler');
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
          [Sequelize.Op.between]: request.publishedBetween
        }
      });
    }
    if (request.validBetween) {
      criteriaList.push({
        [Sequelize.Op.and]: [
          {
            startTime: {
              [Sequelize.Op.lte]: request.validBetween[1]
            }
          },
          {
            endTime: {
              [Sequelize.Op.gte]: request.validBetween[0]
            }
          }
        ]
      });
    }
    if (request.cancelled !== undefined) {
      criteriaList.push({ cancelled: request.cancelled });
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

    let orderDtos = orders.map((d) => TractorOrderAssembler.fromModel(d));

    // Group orders by type
    const ordersByType = orderDtos.reduce((acc, order) => {
      const type = order.orderType || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(order);
      return acc;
    }, {});

    // If it is a known blueprint, retrieve the associated order data (batch by order type)
    for (const type in ordersByType) {
      const service = TractorConstants.knownBlueprints()[type];
      if (service) {
        // Generic retrieval of all blueprint data matching these hashes
        const blueprintHashes = ordersByType[type].map((d) => d.blueprintHash);
        const whereClause = {
          blueprintHash: { [Sequelize.Op.in]: blueprintHashes },
          ...service.orderRequestParams(request.blueprintParams)
        };
        const blueprintData = await service.getOrders(whereClause);

        const dataByHash = blueprintData.reduce((acc, d) => {
          acc[d.blueprintHash] = d;
          return acc;
        }, {});

        // Attach the blueprint specific dto to the order dto
        for (const order of ordersByType[type]) {
          order.blueprintData = dataByHash[order.blueprintHash];
        }
        // For orders which didnt match the blueprint params, remove from the outer response
        orderDtos = orderDtos.filter((order) => !!dataByHash[order.blueprintHash]);
      }
    }

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

  // Sets the cancelled field to true
  static async cancelOrder(blueprintHash) {
    const order = await TractorOrderRepository.findByBlueprintHash(blueprintHash);
    if (order) {
      const dto = TractorOrderAssembler.fromModel(order);
      dto.cancelled = true;
      await this.updateOrders([dto]);
    }
  }
}
module.exports = TractorService;
