const { TractorOrderType, stalkModeToInt } = require('../../../repository/postgres/models/types/types');
const Blueprint = require('./blueprint');
const { sequelize, Sequelize } = require('../../../repository/postgres/models');
const ConvertUpV0ExecutionDto = require('../../../repository/dto/tractor/ConvertUpV0ExecutionDto');
const ConvertUpV0OrderAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-order-convert-up-v0-assembler');
const ConvertUpV0ExecutionAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-execution-convert-up-v0-assembler');
const BlueprintConstants = require('./blueprint-constants');
const InputError = require('../../../error/input-error');
const Contracts = require('../../../datasources/contracts/contracts');
const { C } = require('../../../constants/runtime-constants');
const Interfaces = require('../../../datasources/contracts/interfaces');
const ConvertUpV0OrderDto = require('../../../repository/dto/tractor/ConvertUpV0OrderDto');
const Concurrent = require('../../../utils/async/concurrent');
const BlockUtil = require('../../../utils/block');

class TractorConvertUpV0Service extends Blueprint {
  static orderType = TractorOrderType.CONVERT_UP_V0;
  static orderModel = sequelize.models.TractorOrderConvertUpV0;
  static orderAssembler = ConvertUpV0OrderAssembler;
  static executionModel = sequelize.models.TractorExecutionConvertUpV0;
  static executionAssembler = ConvertUpV0ExecutionAssembler;
  static executionDto = ConvertUpV0ExecutionDto;

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
      // TODO:
      // Sort first by what can be executed now, then by blueprint hash to keep deterministic.
      //
      // Sort by temperature, and hash to keep deterministic
      // const tempDiff = a.blueprintData.temperature - b.blueprintData.temperature;
      // return tempDiff !== 0 ? tempDiff : a.blueprintHash.localeCompare(b.blueprintHash);
    });

    // Can process in parallel by publisher
    const ordersByPublisher = orders.reduce((acc, next) => {
      (acc[next.publisher] ??= []).push(next.blueprintData);
      return acc;
    }, {});

    const siloHelpers = Contracts.get(C().CONVERT_UP_V0_SILO_HELPERS);
    const emptyPlan = {
      sourceTokens: [],
      stems: [],
      amounts: [],
      availableBeans: [],
      totalAvailableBeans: 0n
    };

    const [bonusStalkPerBdv, maxSeasonalCapacity] =
      await Contracts.getBeanstalk().getConvertStalkPerBdvBonusAndMaximumCapacity({
        blockTag: BlockUtil.pauseGuard(blockNumber)
      });

    const TAG = Concurrent.tag(`periodicUpdate-${this.orderType}`);
    for (const publisher in ordersByPublisher) {
      const existingPlans = [];
      const publisherHasMultiple = ordersByPublisher[publisher].length > 1;
      await Concurrent.run(TAG, 20, async () => {
        for (const order of ordersByPublisher[publisher]) {
          const filterParams = [
            order.maxGrownStalkPerBdv, // maxGrownStalkPerBdv
            -(2n ** 95n), // minStem
            true, // excludeGerminatingDeposits
            true, // excludeBean
            stalkModeToInt(order.lowStalkDeposits), // lowStalkDeposits
            bonusStalkPerBdv, // lowGrownStalkPerBdv
            2n ** 95n - 1n, // maxStem
            order.seedDifference // seedDifference
          ];

          // Gets withdraw plans for this order. Onchain call throws if the amount is zero
          try {
            const soloPlan = await siloHelpers.getWithdrawalPlanExcludingPlan(
              { target: 'SuperContract', skipTransform: true, skipRetry: (e) => e.reason === 'No beans available' },
              publisher,
              order.sourceTokenIndices,
              order.beansLeftToConvert,
              filterParams,
              emptyPlan,
              { blockTag: BlockUtil.pauseGuard(blockNumber) }
            );
            order.amountFunded = BigInt(soloPlan.totalAvailableBeans);
          } catch (e) {
            order.amountFunded = 0n;
          }

          if (!publisherHasMultiple) {
            // If this publisher has a single order, there is nothing to cascade; the amount is the same
            order.cascadeAmountFunded = order.amountFunded;
          } else {
            // Combine any existing plans from previously processed orders
            let combinedExistingPlan = null;
            if (existingPlans.length > 0) {
              try {
                combinedExistingPlan = await siloHelpers.combineWithdrawalPlans(
                  { target: 'SuperContract', skipTransform: true },
                  existingPlans,
                  {
                    blockTag: BlockUtil.pauseGuard(blockNumber)
                  }
                );
              } catch (e) {}
            }
            try {
              const cascadePlan = await siloHelpers.getWithdrawalPlanExcludingPlan(
                { target: 'SuperContract', skipTransform: true, skipRetry: (e) => e.reason === 'No beans available' },
                publisher,
                order.sourceTokenIndices,
                order.beansLeftToConvert,
                filterParams,
                combinedExistingPlan ?? emptyPlan,
                { blockTag: BlockUtil.pauseGuard(blockNumber) }
              );
              existingPlans.push(cascadePlan);
              order.cascadeAmountFunded = BigInt(cascadePlan.totalAvailableBeans);
            } catch (e) {
              order.cascadeAmountFunded = 0n;
            }
          }
        }
      });
    }
    await Concurrent.allSettled(TAG);

    // Update sowing order data
    await this.updateOrders(orders.map((o) => o.blueprintData));

    // Consider how to solve the problem of pulling the "wrong source tokens" from an earlier order
    // and thus having fewer funds to to execute a future order. This is not currently handled for sowing.
    // Withdrawal plan always goes in order of the token indices
  }

  static async tryAddRequisition(orderDto, blueprintData) {
    // Decode data
    const convertUpV0Call = this.decodeBlueprintData(blueprintData);
    if (!convertUpV0Call) {
      return;
    }

    const dto = ConvertUpV0OrderDto.fromBlueprintCalldata({
      blueprintHash: orderDto.blueprintHash,
      convertUpParams: convertUpV0Call.args.params.convertUpParams
    });

    // Insert entity
    await this.updateOrders([dto]);

    // Return amount of tip offered
    return convertUpV0Call.args.params.opParams.operatorTipAmount;
  }

  static async orderCancelled(orderDto) {
    // Reset funding amounts
    const convertOrder = await this.getOrder(orderDto.blueprintHash);
    convertOrder.amountFunded = 0n;
    convertOrder.cascadeAmountFunded = 0n;
    await this.updateOrders([convertOrder]);
  }

  static decodeBlueprintData(blueprintData) {
    const iBeanstalk = Interfaces.getBeanstalk();
    const iConvertUpV0 = Interfaces.get(C().CONVERT_UP_V0);

    const advFarm = Interfaces.safeParseTxn(iBeanstalk, blueprintData);
    if (!advFarm || advFarm.name !== 'advancedFarm') {
      return;
    }

    for (const advFarmData of advFarm.args.data) {
      const advFarmCall = Interfaces.safeParseTxn(iBeanstalk, advFarmData.callData);
      if (advFarmCall.name !== 'advancedPipe') {
        return;
      }

      for (const pipeCall of advFarmCall.args.pipes) {
        if (pipeCall.target.toLowerCase() !== C().CONVERT_UP_V0) {
          return;
        }
        return Interfaces.safeParseTxn(iConvertUpV0, pipeCall.callData);
      }
    }
  }

  // Should check whether it can execute this season according to what is the seasonal max value for convert capacity
  // getConvertStalkPerBdvBonusAndMaximumCapacity gives this value for the current season
  static _orderCanExecuteNow(blueprintOrderDto) {
    // Need to check the following fields/conditions
    // The view function results can be passed in?
    // minConvertBonusCapacity;
    // grownStalkPerBdvBonusBid;
    // minPriceToConvertUp;
    // maxPriceToConvertUp;
    // remainingCapacity = beanstalk.getConvertStalkPerBdvBonusAndRemainingCapacity()[1];
    // require(remainingCapacity >= cup.minConvertBonusCapacity);
    // bonusStalkPerBdv = beanstalk.getConvertStalkPerBdvBonusAndRemainingCapacity()[0];
    // require(bonusStalkPerBdv >= cup.grownStalkPerBdvBonusBid);
    // currentPrice = beanstalkPrice.price(ReservesType.INSTANTANEOUS_RESERVES).price;
    // require(currentPrice >= cup.minPriceToConvertUp);
    // require(currentPrice <= cup.maxPriceToConvertUp);
  }

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
