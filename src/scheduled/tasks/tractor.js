const { C } = require('../../constants/runtime-constants');
const TractorConstants = require('../../constants/tractor');
const Contracts = require('../../datasources/contracts/contracts');
const FilterLogs = require('../../datasources/events/filter-logs');
const TractorExecutionDto = require('../../repository/dto/tractor/TractorExecutionDto');
const TractorOrderDto = require('../../repository/dto/tractor/TractorOrderDto');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const TractorService = require('../../service/tractor-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const { sendWebhookMessage } = require('../../utils/discord');
const EnvUtil = require('../../utils/env');
const Log = require('../../utils/logging');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

class TractorTask {
  // Returns true if the task can be called again immediately
  static async updateTractor() {
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(
      AppMetaService.getTractorMeta.bind(AppMetaService),
      MAX_BLOCKS
    );

    if (EnvUtil.getDeploymentEnv() === 'local' && !!EnvUtil.getCustomRpcUrl(C().CHAIN)) {
      const latestBlock = (await C().RPC.getBlock()).number;
      lastUpdate = Math.max(lastUpdate, latestBlock - 10000);
      updateBlock = latestBlock;
    }

    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating tractor for block range [${lastUpdate}, ${updateBlock}]`);

    // Find all PublishRequisition and Tractor events
    const events = await FilterLogs.getBeanstalkEvents(
      ['PublishRequisition', 'CancelBlueprint', 'Tractor'],
      lastUpdate + 1,
      updateBlock
    );

    // Event processing can occur in parallel, but ensure all requisitions are created first
    await AsyncContext.sequelizeTransaction(async () => {
      await this.processEventsConcurrently(events, 'PublishRequisition', this.handlePublishRequsition.bind(this));
      await this.processEventsConcurrently(events, 'CancelBlueprint', this.handleCancelBlueprint.bind(this));
      await this.processEventsConcurrently(events, 'Tractor', this.handleTractor.bind(this));

      // Run periodicUpdate on specialized blueprint modules
      await Promise.all(
        Object.values(TractorConstants.knownBlueprints()).map((b) => {
          // Pass in the getOrders method to avoid circular dependency
          return b.periodicUpdate(TractorService.getOrders.bind(TractorService), updateBlock);
        })
      );

      await AppMetaService.setLastTractorUpdate(updateBlock);
    });

    return !isCaughtUp;
  }

  static async handlePublishRequsition(event) {
    const dto = await TractorOrderDto.fromRequisitionEvt(event);
    const [inserted] = await TractorService.updateOrders([dto]);

    // Additional processing if this requisition corresponds to a known blueprint
    for (const blueprintTask of Object.values(TractorConstants.knownBlueprints())) {
      const tipAmount = await blueprintTask.tryAddRequisition(inserted, event.args.requisition.blueprint.data);
      if (tipAmount) {
        inserted.orderType = blueprintTask.orderType;
        inserted.beanTip = tipAmount;
        await TractorService.updateOrders([inserted]);
      }
    }
  }

  static async handleCancelBlueprint(event) {
    await TractorService.cancelOrder(event.args.blueprintHash);
  }

  static async handleTractor(event) {
    const order = (await TractorService.getOrders({ blueprintHash: event.args.blueprintHash })).orders[0];
    if (!order) {
      // For now I want an alert when this happens.
      sendWebhookMessage(`Tractor event received for unpublished blueprint hash: ${event.args.blueprintHash}`);
      return;
    }

    const receipt = await C().RPC.getTransactionReceipt(event.rawLog.transactionHash);
    const txnEvents = await FilterLogs.getTransactionEvents(
      [Contracts.getBeanstalk(), Contracts.get(C().TRACTOR_HELPERS), Contracts.get(C().SOW_V0)],
      receipt
    );

    // Find events between TractorExecutionBegan and Tractor event indexes
    const began = txnEvents.find(
      (e) => e.name === 'TractorExecutionBegan' && e.args.blueprintHash === event.args.blueprintHash
    );
    if (!began) {
      throw new Error('Could not find TractorExecutionBegan for this Tractor event');
    }
    const gasUsed = began.args.gasleft - event.args.gasleft;
    const ethPriceUsd = await PriceService.getTokenPrice(C().WETH, { blockNumber: event.rawLog.blockNumber });
    const dto = await TractorExecutionDto.fromTractorEvtContext({
      tractorEvent: event,
      receipt,
      gasUsed,
      ethPriceUsd: ethPriceUsd.usdPrice
    });
    const [inserted] = await TractorService.updateExecutions([dto]);

    // Additional processing if this execution corresponds to a known blueprint
    if (order.orderType) {
      const blueprintTask = TractorConstants.knownBlueprints()[order.orderType];
      const innerEvents = txnEvents.filter(
        (e) => e.rawLog.index > began.rawLog.index && e.rawLog.index < event.rawLog.index
      );
      const tipUsd = await blueprintTask.orderExecuted(order, inserted, innerEvents);
      if (tipUsd) {
        inserted.tipUsd = tipUsd;
        await TractorService.updateExecutions([inserted]);
      }
    }
  }

  static async processEventsConcurrently(allEvents, eventName, handler) {
    const events = allEvents.filter((e) => e.name === eventName);
    const TAG = Concurrent.tag(eventName);
    for (const event of events) {
      await Concurrent.run(TAG, 50, async () => {
        await handler(event);
      });
    }
    await Concurrent.allResolved(TAG);
  }
}
module.exports = TractorTask;
