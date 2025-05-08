const FilterLogs = require('../../datasources/events/filter-logs');
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
        fromBlock: 29958513, /////
        toBlock: 29958578 /////
      }
    );
    let i = 0;

    // Group events by transaction

    // Determine net of add/remove

    // Output an error if Pick doesnt match with add deposit
    // Output an error if Convert is not able to match with remove/add deposit(s)

    return !isCaughtUp;
  }
}
module.exports = SiloInflowsTask;
