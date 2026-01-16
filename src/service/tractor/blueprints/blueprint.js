const SharedService = require('../../shared-service');
const { fromBigInt } = require('../../../utils/number');
const PriceService = require('../../price-service');
const { C } = require('../../../constants/runtime-constants');
const BlueprintConstants = require('./blueprint-constants');
const Interfaces = require('../../../datasources/contracts/interfaces');

// Base class for Tractor blueprint services
class BlueprintService {
  static orderType;
  static orderModel;
  static orderAssembler;
  static executionModel;
  static executionAssembler;
  static executionDto;

  /**
   * Performs periodic updates for the blueprint's entities
   * @abstract
   */
  static async periodicUpdate(
    TractorService_getOrders,
    TractorService_updateOrders,
    blockNumber,
    siloUpdateAccounts,
    forceUpdateAll
  ) {
    throw new Error('periodicUpdate must be implemented by subclass');
  }

  /**
   * Attempts to add a requisition for this blueprint type. Does nothing if its not.
   * @abstract
   */
  static async tryAddRequisition(orderDto, blueprintData) {
    throw new Error('tryAddRequisition must be implemented by subclass');
  }

  /**
   * Manages order updates after a cancellation.
   * @abstract
   */
  static async orderCancelled(orderDto) {
    throw new Error('orderCancelled must be implemented by subclass');
  }

  // Future work is to put the params/validations in a general location such that blueprints can mix/match
  // which ones they want to use. This would be helpful if we have many different blueprints.

  /**
   * Validates blueprint-specific order parameters
   * @abstract
   */
  static validateOrderParams(blueprintParams) {
    throw new Error('validateOrderParams must be implemented by subclass');
  }

  /**
   * Returns a where clause for filtering blueprint orders
   * @abstract
   */
  static orderRequestParams(blueprintParams) {
    throw new Error('orderRequestParams must be implemented by subclass');
  }

  /**
   * Validates blueprint-specific execution parameters
   * @abstract
   */
  static validateExecutionParams(blueprintParams) {
    throw new Error('validateExecutionParams must be implemented by subclass');
  }

  /**
   * Returns a where clause for filtering blueprint executions
   * @abstract
   */
  static executionRequestParams(blueprintParams) {
    throw new Error('executionRequestParams must be implemented by subclass');
  }

  /**
   * Decodes blueprint-specific data if it matches a known blueprint version
   */
  static decodeBlueprintData(blueprintData) {
    const unknown = { version: 'UNKNOWN', calldata: null };

    const iBeanstalk = Interfaces.getBeanstalk();
    const advFarm = Interfaces.safeParseTxn(iBeanstalk, blueprintData);
    if (!advFarm || advFarm.name !== 'advancedFarm') {
      return unknown;
    }

    for (const advFarmData of advFarm.args.data) {
      const advFarmCall = Interfaces.safeParseTxn(iBeanstalk, advFarmData.callData);
      if (advFarmCall.name !== 'advancedPipe') {
        return unknown;
      }

      for (const pipeCall of advFarmCall.args.pipes) {
        const blueprintVersion = BlueprintConstants.blueprintVersion(this.orderType, pipeCall.target.toLowerCase());
        if (!blueprintVersion) {
          return unknown;
        }

        const iBlueprint = Interfaces.get(pipeCall.target.toLowerCase());
        return {
          version: blueprintVersion,
          calldata: Interfaces.safeParseTxn(iBlueprint, pipeCall.callData)
        };
      }
    }
  }

  /**
   * Manages order updates after an execution. Returns amount of tip paid in usd, if any
   */
  static async orderExecuted(blueprintOrderDto, baseExecutionDto, innerEvents) {
    // Update current order entity state
    await blueprintOrderDto.updateFieldsUponExecution(innerEvents);
    await this.updateOrders([blueprintOrderDto]);

    // Insert execution entity
    const blueprintExecutionDto = await this.executionDto.fromExecutionContext({
      baseExecutionDto,
      innerEvents
    });
    await this.updateExecutions([blueprintExecutionDto]);

    // Return amount of tip paid in usd
    const operatorReward = innerEvents.find((e) => e.name === 'OperatorReward');
    if (operatorReward.args.token.toLowerCase() === C().BEAN) {
      const beanPrice = await PriceService.getBeanPrice({ blockNumber: operatorReward.rawLog.blockNumber });
      const tipUsd = fromBigInt(BigInt(operatorReward.args.amount), 6) * beanPrice.usdPrice;
      return tipUsd;
    }
  }

  /**
   * Gets an order by its blueprint hash
   */
  static async getOrder(blueprintHash) {
    const orders = await this.getOrders({ blueprintHash });
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    return orders[0];
  }

  /**
   * Gets orders by a where clause
   */
  static async getOrders(whereClause) {
    return await SharedService.genericEntityRetrieval(this.orderModel, this.orderAssembler, whereClause);
  }

  /**
   * Updates orders via upsert
   */
  static async updateOrders(orderDtos) {
    return await SharedService.genericEntityUpdate(orderDtos, this.orderModel, this.orderAssembler, true);
  }

  /**
   * Gets executions by a where clause
   */
  static async getExecutions(whereClause) {
    return await SharedService.genericEntityRetrieval(this.executionModel, this.executionAssembler, whereClause);
  }

  /**
   * Updates executions via upsert
   */
  static async updateExecutions(executionDtos) {
    return await SharedService.genericEntityUpdate(executionDtos, this.executionModel, this.executionAssembler, true);
  }
}

module.exports = BlueprintService;
