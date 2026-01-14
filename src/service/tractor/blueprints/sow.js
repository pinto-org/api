const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../../../datasources/contracts/contracts');
const Interfaces = require('../../../datasources/contracts/interfaces');
const InputError = require('../../../error/input-error');
const SowExecutionDto = require('../../../repository/dto/tractor/SowExecutionDto');
const SowOrderDto = require('../../../repository/dto/tractor/SowOrderDto');
const { sequelize, Sequelize } = require('../../../repository/postgres/models');
const SowExecutionAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-execution-sow-assembler');
const SowOrderAssembler = require('../../../repository/postgres/models/assemblers/tractor/tractor-order-sow-assembler');
const { TractorOrderType } = require('../../../repository/postgres/models/types/types');
const Concurrent = require('../../../utils/async/concurrent');
const BlockUtil = require('../../../utils/block');
const Blueprint = require('./blueprint');
const BlueprintConstants = require('./blueprint-constants');

class TractorSowService extends Blueprint {
  static orderType = TractorOrderType.SOW_V0;
  static orderModel = sequelize.models.TractorOrderSow;
  static orderAssembler = SowOrderAssembler;
  static executionModel = sequelize.models.TractorExecutionSow;
  static executionAssembler = SowExecutionAssembler;
  static executionDto = SowExecutionDto;

  /**
   * Determine how many pinto can be sown into each order, accounting for cascading order execution.
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
        orderType: TractorOrderType.SOW_V0,
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
    const [season, maxTemperature, podlineLength] = await Promise.all([
      (async () => Number(await Contracts.getBeanstalk().season({ blockTag })))(),
      (async () => BigInt(await Contracts.getBeanstalk().maxTemperature({ blockTag })))(),
      (async () => BigInt(await Contracts.getBeanstalk().totalUnharvestable(0, { blockTag })))()
    ]);

    // Evaluate whether the order can be executed
    const ordersToUpdate = [];
    for (const o of orders) {
      if (
        o.lastExecutableSeason !== season &&
        o.blueprintData.canExecuteThisSeason({ maxTemperature, podlineLength })
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
      return (
        bVal - aVal ||
        Number(a.blueprintData.minTemp - b.blueprintData.minTemp) ||
        a.blueprintHash.localeCompare(b.blueprintHash)
      );
    });

    // Can process in parallel by publisher
    const sowOrdersByPublisher = orders.reduce((acc, next) => {
      (acc[next.publisher] ??= []).push(next.blueprintData);
      return acc;
    }, {});

    const tractorHelpers = Contracts.get(C().SOW_V0_TRACTOR_HELPERS);
    const emptyPlan = {
      sourceTokens: [],
      stems: [],
      amounts: [],
      availableBeans: [],
      totalAvailableBeans: 0n
    };

    const TAG = Concurrent.tag(`periodicUpdate-${this.orderType}`);
    for (const publisher in sowOrdersByPublisher) {
      const existingPlans = [];
      const publisherHasMultiple = sowOrdersByPublisher[publisher].length > 1;
      await Concurrent.run(TAG, 20, async () => {
        for (const order of sowOrdersByPublisher[publisher]) {
          // Gets withdraw plans for this order. Onchain call throws if the amount is zero
          try {
            const soloPlan = await tractorHelpers.getWithdrawalPlanExcludingPlan(
              { target: 'SuperContract', skipTransform: true, skipRetry: (e) => e.reason === 'No beans available' },
              publisher,
              order.sourceTokenIndices,
              order.totalAmountToSow - order.pintoSownCounter,
              order.maxGrownStalkPerBdv,
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
              const cascadePlan = await tractorHelpers.getWithdrawalPlanExcludingPlan(
                { target: 'SuperContract', skipTransform: true, skipRetry: (e) => e.reason === 'No beans available' },
                publisher,
                order.sourceTokenIndices,
                order.totalAmountToSow - order.pintoSownCounter,
                order.maxGrownStalkPerBdv,
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
    const sowV0Call = this.decodeBlueprintData(blueprintData);
    if (!sowV0Call) {
      return;
    }

    const dto = SowOrderDto.fromBlueprintCalldata({
      blueprintHash: orderDto.blueprintHash,
      // TODO: will need to pass referral address here (not included in sow params)
      sowParams: sowV0Call.args.params.sowParams
    });

    // Insert entity
    await this.updateOrders([dto]);

    // Return amount of tip offered
    return sowV0Call.args.params.opParams.operatorTipAmount;
  }

  static async orderCancelled(orderDto) {
    // Reset funding amounts
    const sowOrder = await this.getOrder(orderDto.blueprintHash);
    sowOrder.amountFunded = 0n;
    sowOrder.cascadeAmountFunded = 0n;
    await this.updateOrders([sowOrder]);
  }

  // If possible, decodes blueprint data into the sowBlueprintv0 call
  static decodeBlueprintData(blueprintData) {
    const iBeanstalk = Interfaces.getBeanstalk();
    // Could iterate different sowing compatible blueprints here.
    const iSowV0 = Interfaces.get(C().SOW_V0);

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
        if (pipeCall.target.toLowerCase() !== C().SOW_V0) {
          return;
        }
        return Interfaces.safeParseTxn(iSowV0, pipeCall.callData);
      }
    }
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
module.exports = TractorSowService;
