const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const FieldInflowService = require('../../service/inflow/field-inflow-service');
const FieldInflowSnapshotService = require('../../service/inflow/field-inflow-snapshot-service');
const AppMetaService = require('../../service/meta-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const Log = require('../../utils/logging');
const TaskRangeUtil = require('../util/task-range');
const FieldInflowsUtil = require('../util/field-inflows');
const SiloInflowsUtil = require('../util/silo-inflows');
const SiloEvents = require('../../datasources/events/silo-events');
const SiloInflowService = require('../../service/inflow/silo-inflow-service');
const SiloInflowSnapshotService = require('../../service/inflow/silo-inflow-snapshot-service');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

const FIELD_EVENTS = new Set(['Sow', 'Harvest', 'PodListingFilled', 'PodOrderFilled']);
const SILO_EVENTS = new Set(['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'Plant', 'Convert', 'ClaimPlenty']);
const ALL_EVENTS = [...FIELD_EVENTS, ...SILO_EVENTS];

class InflowsTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getInflowMeta();
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS);
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating inflows for block range [${lastUpdate}, ${updateBlock}]`);

    const events = await FilterLogs.getBeanstalkEvents(ALL_EVENTS, {
      fromBlock: lastUpdate + 1,
      toBlock: updateBlock
    });
    // TODO: Sort by log index?

    await EventsUtils.attachTimestamps(events);
    const byTxn = await EventsUtils.groupByTransaction(events);

    const siloInflowDtos = [];
    const fieldInflowDtos = [];

    const TAG = Concurrent.tag('inflows');
    for (const txnHash in byTxn) {
      await Concurrent.run(TAG, 25, async () => {
        const txnEvents = byTxn[txnHash];
        const converts = txnEvents.filter((e) => e.name === 'Convert');
        const plants = txnEvents.filter((e) => e.name === 'Plant');
        const addRemoves = txnEvents.filter((e) => e.name.includes('Deposit'));
        const claimPlenties = txnEvents.filter((e) => e.name === 'ClaimPlenty');
        const fieldEvents = txnEvents.filter((e) => FIELD_EVENTS.has(e.name));

        // Ignore add/removal matching convert or pick
        SiloEvents.removeConvertRelatedEvents(addRemoves, converts);
        SiloEvents.removePlantRelatedEvents(addRemoves, plants);

        const beanPrice = (await PriceService.getBeanPrice({ blockNumber: txnEvents[0].rawLog.blockNumber })).usdPrice;

        // Attaches bdv/bean price to the plenty events
        await SiloInflowsUtil.assignClaimPlentyBdvs(claimPlenties, beanPrice, txnEvents[0].rawLog.blockNumber);

        const netDeposits = SiloInflowsUtil.netDeposits(addRemoves);
        const netSilo = SiloInflowsUtil.netBdvInflows(netDeposits, claimPlenties);
        const netField = FieldInflowsUtil.netBdvInflows(fieldEvents);

        const txnMeta = {
          block: txnEvents[0].rawLog.blockNumber,
          timestamp: txnEvents[0].extra.timestamp,
          txnHash,
          beanPrice
        };

        // Generate inflow dtos in consideration of potential negations on the other side
        siloInflowDtos.push(...(await SiloInflowsUtil.inflowsFromNetDeposits(netDeposits, netField, txnMeta)));
        siloInflowDtos.push(...(await SiloInflowsUtil.inflowsFromClaimPlenties(claimPlenties, netField, txnMeta)));
        fieldInflowDtos.push(...(await FieldInflowsUtil.inflowsFromFieldEvents(fieldEvents, netSilo, txnMeta)));
      });
    }

    await Concurrent.allResolved(TAG);

    // Save new entities
    await AsyncContext.sequelizeTransaction(async () => {
      await SiloInflowService.insertInflows(siloInflowDtos);
      await FieldInflowService.insertInflows(fieldInflowDtos);
      await SiloInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await FieldInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await AppMetaService.setLastInflowUpdate(updateBlock);
    });

    return !isCaughtUp;
  }
}
module.exports = InflowsTask;
