const { C } = require('../../constants/runtime-constants');
const SiloEvents = require('../../datasources/events/silo-events');
const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const SiloInflowDto = require('../../repository/dto/inflow/SiloInflowDto');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const SiloInflowService = require('../../service/inflow/silo-inflow-service');
const SiloService = require('../../service/silo-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const Log = require('../../utils/logging');
const { bigintFloatMultiplier, fromBigInt, toBigInt } = require('../../utils/number');
const TaskRangeUtil = require('../util/task-range');
const SiloInflowSnapshotService = require('../../service/inflow/silo-inflow-snapshot-service');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

/**
 * @deprecated Use the combined Inflow task instead
 */
class SiloInflowsTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getSiloInflowMeta();
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS);
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating silo inflows for block range [${lastUpdate}, ${updateBlock}]`);

    const events = await FilterLogs.getBeanstalkEvents(
      ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'Plant', 'Convert', 'ClaimPlenty'],
      {
        fromBlock: lastUpdate + 1,
        toBlock: updateBlock
      }
    );

    await EventsUtils.attachTimestamps(events);

    const inflowDtos = [];

    // Group events by transaction
    const TAG = Concurrent.tag('siloInflowTxns');
    const grouped = await EventsUtils.groupByTransaction(events);
    for (const txnHash in grouped) {
      await Concurrent.run(TAG, 25, async () => {
        const txnEvents = grouped[txnHash];
        const converts = txnEvents.filter((e) => e.name === 'Convert');
        const plants = txnEvents.filter((e) => e.name === 'Plant');
        const addRemoves = txnEvents.filter((e) => e.name.includes('Deposit'));

        // Ignore add/removal matching convert or pick
        SiloEvents.removeConvertRelatedEvents(addRemoves, converts);
        SiloEvents.removePlantRelatedEvents(addRemoves, plants);

        // Determine net of add/remove
        const netDeposits = SiloEvents.netDeposits(addRemoves);
        inflowDtos.push(
          ...(await this.inflowsFromNetDeposits(netDeposits, {
            block: txnEvents[0].rawLog.blockNumber,
            timestamp: txnEvents[0].extra.timestamp,
            txnHash
          }))
        );

        // Record outflows from claim plenty
        const claimPlenties = txnEvents.filter((e) => e.name === 'ClaimPlenty');
        inflowDtos.push(
          ...(await this.inflowsFromClaimPlenties(claimPlenties, {
            block: txnEvents[0].rawLog.blockNumber,
            timestamp: txnEvents[0].extra.timestamp,
            txnHash
          }))
        );
      });
    }
    await Concurrent.allResolved(TAG);

    // Save new entities
    await AsyncContext.sequelizeTransaction(async () => {
      await SiloInflowService.insertInflows(inflowDtos);
      await SiloInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await AppMetaService.setLastSiloInflowUpdate(updateBlock);
    });

    return !isCaughtUp;
  }
}
module.exports = SiloInflowsTask;
