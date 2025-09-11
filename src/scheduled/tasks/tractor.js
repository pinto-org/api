const { C } = require('../../constants/runtime-constants');
const TractorConstants = require('../../constants/tractor');
const Contracts = require('../../datasources/contracts/contracts');
const FilterLogs = require('../../datasources/events/filter-logs');
const { logIndex } = require('../../datasources/rpc-discrepancies');
const TractorExecutionDto = require('../../repository/dto/tractor/TractorExecutionDto');
const TractorOrderDto = require('../../repository/dto/tractor/TractorOrderDto');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const SnapshotSowV0Service = require('../../service/tractor/snapshot-sow-v0-service');
const TractorService = require('../../service/tractor/tractor-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const EnvUtil = require('../../utils/env');
const Log = require('../../utils/logging');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

class TractorTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const [meta, snapshotBlock] = await Promise.all([
      AppMetaService.getTractorMeta(),
      SnapshotSowV0Service.nextSnapshotBlock()
    ]);
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS, {
      maxReturnBlock: snapshotBlock,
      // In the case of a pause, need to continue processing PublishRequisition/CancelBlueprint, which don't depend on any diamond
      // onchain function. Tractor would never emit.
      // The snapshot will however avoid calling view functions with blocks during the pause.
      skipPausedRange: false
    });

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
    const events = await FilterLogs.getBeanstalkEvents(['PublishRequisition', 'CancelBlueprint', 'Tractor'], {
      fromBlock: lastUpdate + 1,
      toBlock: updateBlock
    });

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

      if (updateBlock >= snapshotBlock) {
        await SnapshotSowV0Service.takeSnapshot(updateBlock);
      }

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
    const [receipt, order, ethPriceUsd] = await Promise.all([
      C().RPC.getTransactionReceipt(event.rawLog.transactionHash),
      (async () => (await TractorService.getOrders({ blueprintHash: event.args.blueprintHash })).orders[0])(),
      PriceService.getTokenPrice(C().WETH, { blockNumber: event.rawLog.blockNumber })
    ]);
    if (!order) {
      // Tractor event received for unpublished blueprint hash. Skip it
      return;
    }
    // TODO: this might actually break for convert since we will be checking the Convert event (which is changing)
    const txnEvents = await FilterLogs.getTransactionEvents(
      [Contracts.getBeanstalk(), Contracts.get(C().TRACTOR_HELPERS), Contracts.get(C().SOW_V0)],
      receipt
    );

    // Find events between TractorExecutionBegan and Tractor event indexes
    const began = txnEvents.find(
      (e) =>
        e.name === 'TractorExecutionBegan' &&
        e.args.blueprintHash === event.args.blueprintHash &&
        Number(e.args.nonce) === Number(event.args.nonce)
    );
    if (!began) {
      throw new Error('Could not find TractorExecutionBegan for this Tractor event');
    }
    // There is ~120k of gas overhead in calling the tractor function.
    // Split this cost among however many Tractor executions are in this transaction.
    const overheadGas = 120000 / txnEvents.filter((e) => e.name === 'Tractor').length;
    const gasUsed = overheadGas + Number(began.args.gasleft - event.args.gasleft);
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
        (e) => logIndex(e.rawLog) > logIndex(began.rawLog) && logIndex(e.rawLog) < logIndex(event.rawLog)
      );
      const tipUsd = await blueprintTask.orderExecuted(order.blueprintData, inserted, innerEvents);
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
