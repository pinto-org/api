const { TractorOrderType, stalkModeToInt } = require('../../../repository/postgres/models/types/types');
const Blueprint = require('./blueprint');
const { sequelize, Sequelize } = require('../../../repository/postgres/models');
const ConvertUpExecutionDto = require('../../../repository/dto/tractor/ConvertUpExecutionDto');
const ConvertUpOrderAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-order-convert-up-assembler');
const ConvertUpExecutionAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-execution-convert-up-assembler');
const BlueprintConstants = require('./blueprint-constants');
const InputError = require('../../../error/input-error');
const Contracts = require('../../../datasources/contracts/contracts');
const { C } = require('../../../constants/runtime-constants');
const Interfaces = require('../../../datasources/contracts/interfaces');
const ConvertUpOrderDto = require('../../../repository/dto/tractor/ConvertUpOrderDto');
const Concurrent = require('../../../utils/async/concurrent');
const BlockUtil = require('../../../utils/block');
const BeanstalkPrice = require('../../../datasources/contracts/upgradeable/beanstalk-price');

class TractorConvertUpService extends Blueprint {
  static orderType = TractorOrderType.CONVERT_UP;
  static orderModel = sequelize.models.TractorOrderConvertUp;
  static orderAssembler = ConvertUpOrderAssembler;
  static executionModel = sequelize.models.TractorExecutionConvertUp;
  static executionAssembler = ConvertUpExecutionAssembler;
  static executionDto = ConvertUpExecutionDto;

  /**
   * Determine how many pinto can be converted in each order, accounting for cascading order execution.
   * One publisher may have multiple orders that could be executed during the same season
   */
  static async periodicUpdate(
    TractorService_getOrders,
    TractorService_updateOrders,
    blockNumber,
    siloUpdateAccounts,
    forceUpdateAll
  ) {
    let orders = (
      await TractorService_getOrders({
        orderType: TractorOrderType.CONVERT_UP,
        cancelled: false,
        blueprintParams: {
          orderComplete: false
        },
        // Skip/publisher sort isnt necessary unless there are many open orders.
        limit: 25000
      })
    ).orders;

    if (orders.length === 0) {
      // Nothing to update
      return;
    }

    const blockTag = BlockUtil.pauseGuard(blockNumber);
    const [season, { price: currentPrice }, [bonusStalkPerBdv, maxSeasonalCapacity]] = await Promise.all([
      (async () => Number(await Contracts.getBeanstalk().season({ blockTag })))(),
      BeanstalkPrice.make({ block: blockTag }).priceReservesCurrent(),
      Contracts.getBeanstalk().getConvertStalkPerBdvBonusAndMaximumCapacity({ blockTag })
    ]);

    // Evaluate whether the order can be executed
    const ordersToUpdate = [];
    for (const o of orders) {
      if (
        o.lastExecutableSeason !== season &&
        o.blueprintData.canExecuteThisSeason({ currentPrice, bonusStalkPerBdv, maxSeasonalCapacity })
      ) {
        o.lastExecutableSeason = season;
        ordersToUpdate.push(o);
      }
    }
    await TractorService_updateOrders(ordersToUpdate);

    if (!forceUpdateAll) {
      // Only update orders with recent silo activity
      orders = orders.filter((o) => siloUpdateAccounts.has(o.publisher.toLowerCase()));
    }

    // Sort orders that can be executed first
    orders.sort((a, b) => {
      const aVal = a.lastExecutableSeason || 0;
      const bVal = b.lastExecutableSeason || 0;
      return bVal - aVal || a.blueprintHash.localeCompare(b.blueprintHash);
    });

    // Can process in parallel by publisher
    const ordersByPublisher = orders.reduce((acc, next) => {
      (acc[next.publisher] ??= []).push(next.blueprintData);
      return acc;
    }, {});

    const tractorHelpers = Contracts.get(C().CONVERT_UP_V0_TRACTOR_HELPERS);
    const siloHelpers = Contracts.get(C().CONVERT_UP_V0_SILO_HELPERS);
    const emptyPlan = {
      sourceTokens: [],
      stems: [],
      amounts: [],
      availableBeans: [],
      totalAvailableBeans: 0n
    };

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
              { blockTag }
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
                combinedExistingPlan = await tractorHelpers.combineWithdrawalPlans(
                  { target: 'SuperContract', skipTransform: true },
                  existingPlans,
                  { blockTag }
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
                { blockTag }
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
  }

  static async tryAddRequisition(orderDto, blueprintData) {
    // Decode data
    const { version, calldata } = this.decodeBlueprintData(blueprintData);
    if (!calldata) {
      return;
    }

    const dto = ConvertUpOrderDto.fromBlueprintCalldata({
      blueprintHash: orderDto.blueprintHash,
      convertUpParams: calldata.args.params.convertUpParams
    });

    // Insert entity
    await this.updateOrders([dto]);

    // Return amount of tip offered
    return calldata.args.params.opParams.operatorTipAmount;
  }

  static async orderCancelled(orderDto) {
    // Reset funding amounts
    const convertOrder = await this.getOrder(orderDto.blueprintHash);
    convertOrder.amountFunded = 0n;
    convertOrder.cascadeAmountFunded = 0n;
    await this.updateOrders([convertOrder]);
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
module.exports = TractorConvertUpService;
