const { TractorOrderType } = require('../../../repository/postgres/models/types/types');
const Blueprint = require('./blueprint');
const { sequelize, Sequelize } = require('../../../repository/postgres/models');
const ConvertUpV0ExecutionDto = require('../../../repository/dto/tractor/ConvertUpV0ExecutionDto');
const ConvertUpV0OrderAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-order-convert-up-v0-assembler');
const ConvertUpV0ExecutionAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-execution-convert-up-v0-assembler');
const BlueprintConstants = require('./blueprint-constants');
const InputError = require('../../../error/input-error');

class TractorConvertUpV0Service extends Blueprint {
  static orderType = TractorOrderType.CONVERT_UP_V0;
  static orderModel = sequelize.models.TractorOrderConvertUpV0;
  static orderAssembler = ConvertUpV0OrderAssembler;
  static executionModel = sequelize.models.TractorExecutionConvertUpV0;
  static executionAssembler = ConvertUpV0ExecutionAssembler;
  static executionDto = ConvertUpV0ExecutionDto;

  // Behavior TBD
  static async periodicUpdate(TractorService_getOrders, blockNumber) {
    // This will check all entities and try to update amountFunded/cascade amounts
    const orders = (
      await TractorService_getOrders({
        orderType: TractorOrderType.CONVERT_UP_V0,
        cancelled: false,
        blueprintParams: {
          orderComplete: false
        },
        // Skip/publisher sort isnt necessary unless there are many open orders.
        limit: 25000
      })
    ).orders.sort((a, b) => {
      // Sorting TBD
      // Sort by temperature, and hash to keep deterministic
      // const tempDiff = a.blueprintData.temperature - b.blueprintData.temperature;
      // return tempDiff !== 0 ? tempDiff : a.blueprintHash.localeCompare(b.blueprintHash);
    });

    // Can process in parallel by publisher
    const ordersByPublisher = orders.reduce((acc, next) => {
      (acc[next.publisher] ??= []).push(next.blueprintData);
      return acc;
    }, {});

    const tractorHelpers = Contracts.get(C().CONVERT_UP_V0_TRACTOR_HELPERS);
    const emptyPlan = {
      sourceTokens: [],
      stems: [],
      amounts: [],
      availableBeans: [],
      totalAvailableBeans: 0n
    };

    const filterParams = [
      uint256(int256(type(int96).max)), // maxGrownStalkPerBdv (TODO params.convertUpParams.maxGrownStalkPerBdv)
      type(int96).min, // minStem
      true, // excludeGerminatingDeposits
      true, // excludeBean
      Model.USE, // lowStalkDeposits (TODO params.convertUpParams.lowStalkDeposits)
      0, // lowGrownStalkPerBdv (TODO beanstalk.getConvertStalkPerBdvBonusAndRemainingCapacity()[0])
      type(int96).max // maxStem
    ];

    const TAG = Concurrent.tag(`periodicUpdate-${this.orderType}`);
    for (const publisher in ordersByPublisher) {
      //
    }
    await Concurrent.allSettled(TAG);

    // Update order data
    await this.updateOrders(orders.map((o) => o.blueprintData));
  }

  static async tryAddRequisition(orderDto, blueprintData) {
    // Cant write this until we have a blueprint to test with
  }

  static async orderCancelled(orderDto) {
    // Reset funding amounts
  }

  static decodeBlueprintData(blueprintData) {
    //
  }

  // TODO: can put these in a general location and allow blueprints to mix/match which validations and conversions they use
  static validateOrderParams(blueprintParams) {
    if (blueprintParams.orderComplete !== undefined && typeof blueprintParams.orderComplete !== 'boolean') {
      throw new InputError('orderComplete must be a boolean');
    }
  }

  static orderRequestParams(blueprintParams) {
    const where = {};
    if (blueprintParams) {
      if (blueprintParams.orderComplete !== undefined) {
        where.orderComplete = { [Sequelize.Op.eq]: blueprintParams.orderComplete };
      }
    }
    return where;
  }

  static validateExecutionParams(blueprintParams) {
    if (
      blueprintParams.usedToken !== undefined &&
      BlueprintConstants.tokenIndexMap()[blueprintParams.usedToken.toLowerCase()] === undefined
    ) {
      throw new InputError('usedToken must correspond to a valid silo token address');
    }
  }

  static executionRequestParams(blueprintParams) {
    const where = {};
    if (blueprintParams) {
      if (blueprintParams.usedToken !== undefined) {
        where.usedTokenIndices = {
          [Sequelize.Op.like]: `%${BlueprintConstants.tokenIndexMap()[blueprintParams.usedToken.toLowerCase()]}%`
        };
      }
    }
    return where;
  }
}
module.exports = TractorConvertUpV0Service;
