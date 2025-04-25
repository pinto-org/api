const SharedService = require('../../shared-service');

// Base class for Tractor blueprint services
class BlueprintService {
  static orderType;
  static orderModel;
  static orderAssembler;
  static executionModel;
  static executionAssembler;

  /**
   * Performs periodic updates for the blueprint's entities
   * @abstract
   */
  static async periodicUpdate(TractorService_getOrders, blockNumber) {
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
   * Manages order updates after an execution. Returns amount of tip paid in usd, if any
   * @abstract
   */
  static async orderExecuted(orderDto, executionDto, innerEvents) {
    throw new Error('orderExecuted must be implemented by subclass');
  }

  /**
   * Attempts to decode blueprint-specific data
   * @abstract
   */
  static decodeBlueprintData(blueprintData) {
    throw new Error('decodeBlueprintData must be implemented by subclass');
  }

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
