const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const AppMetaService = require('../../service/meta-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

class FieldInflowsTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getFieldInflowMeta();
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS);
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating field inflows for block range [${lastUpdate}, ${updateBlock}]`);

    const events = await FilterLogs.getBeanstalkEvents(['Sow', 'Harvest', 'PodListingFilled', 'PodOrderFilled'], {
      fromBlock: lastUpdate + 1,
      toBlock: updateBlock
    });

    await EventsUtils.attachTimestamps(events);

    const inflowDtos = [];

    const TAG = Concurrent.tag('fieldInflows');
    for (const e of events) {
      await Concurrent.run(TAG, 25, async () => {
        if (e.name in ['Sow', 'Harvest']) {
          // beans
        } else {
          // 2 inflows: one per account
          // costInBeans
        }
      });
    }
    await Concurrent.allResolved(TAG);

    // Save new entities
    await AsyncContext.sequelizeTransaction(async () => {
      await FieldInflowService.insertInflows(inflowDtos);
      // await FieldInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await AppMetaService.setLastFieldInflowUpdate(updateBlock);
    });

    return !isCaughtUp;
  }
}
module.exports = FieldInflowsTask;
