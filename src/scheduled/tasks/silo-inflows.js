const DepositEvents = require('../../datasources/events/deposit-events');
const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const AppMetaService = require('../../service/meta-service');
const Log = require('../../utils/logging');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

class SiloInflowsTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getSiloInflowMeta();
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS);
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating deposits for block range [${lastUpdate}, ${updateBlock}]`);

    // Test range includes convert, withdrawal, and withdrawal to sow
    const events = await FilterLogs.getBeanstalkEvents(
      ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'Plant', 'Convert'],
      {
        // contains convert
        // fromBlock: 29958513, /////
        // toBlock: 29958578 /////
        // contains plant
        // fromBlock: 22650525, /////
        // toBlock: 22651999 /////
        // contains transfer
        fromBlock: 22651930,
        toBlock: 22651932
      }
    );

    await EventsUtils.attachTimestamps(events);

    // Group events by transaction
    const grouped = await EventsUtils.groupByTransaction(events);
    for (const txnHash in grouped) {
      const events = grouped[txnHash];
      const converts = events.filter((e) => e.name === 'Convert');
      const plants = events.filter((e) => e.name === 'Plant');
      const addRemoves = events.filter((e) => e.name.includes('Deposit'));

      // Ignore add/removal matching convert or pick
      DepositEvents.removeConvertRelatedEvents(addRemoves, converts);
      DepositEvents.removePlantRelatedEvents(addRemoves, plants);

      // Determine net of add/remove
      const netDeposits = DepositEvents.netDeposits(addRemoves);
    }

    return !isCaughtUp;
  }
}
module.exports = SiloInflowsTask;
