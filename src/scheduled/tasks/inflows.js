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

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

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

    await EventsUtils.attachTimestamps(events);
    const byTxn = await EventsUtils.groupByTransaction(events);

    const inflowDtos = [];

    const TAG = Concurrent.tag('inflows');
    for (const txnHash in byTxn) {
      await Concurrent.run(TAG, 25, async () => {
        const txnEvents = byTxn[txnHash];
        const converts = txnEvents.filter((e) => e.name === 'Convert');
        const plants = txnEvents.filter((e) => e.name === 'Plant');
        const addRemoves = txnEvents.filter((e) => e.name.includes('Deposit'));

        // Ignore add/removal matching convert or pick
        SiloEvents.removeConvertRelatedEvents(addRemoves, converts);
        SiloEvents.removePlantRelatedEvents(addRemoves, plants);

        // Determine net of add/remove
        const netSilo = SiloInflowsUtil.netDeposits(addRemoves); // This might not be exactly whats needed because it doesnt have claimplenty
        const netField = FieldInflowsUtil.netInflows(fieldEvents);

        // inflowDtos.push(...(await this.inflowsFromEvent(e)));
      });
    }

    await Concurrent.allResolved(TAG);

    // Save new entities
    await AsyncContext.sequelizeTransaction(async () => {
      await FieldInflowService.insertInflows(inflowDtos);
      await FieldInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await AppMetaService.setLastFieldInflowUpdate(updateBlock);
    });

    return !isCaughtUp;
  }

  // Returns net inflow/outflow of both silo and field per account within this transaction
  static async calcNetInflow(allTxnLogs) {}
}
module.exports = InflowsTask;
