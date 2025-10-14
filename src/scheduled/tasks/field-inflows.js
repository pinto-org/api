const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const FieldInflowDto = require('../../repository/dto/inflow/FieldInflowDto');
const FieldInflowService = require('../../service/inflow/field-inflow-service');
const FieldInflowSnapshotService = require('../../service/inflow/field-inflow-snapshot-service');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const Log = require('../../utils/logging');
const { fromBigInt } = require('../../utils/number');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

/**
 * @deprecated Use the combined Inflow task instead
 */
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
        inflowDtos.push(...(await this.inflowsFromEvent(e)));
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

  static async inflowsFromEvent(e) {
    const beanPrice = (await PriceService.getBeanPrice({ blockNumber: e.rawLog.blockNumber })).usdPrice;
    if (['Sow', 'Harvest'].includes(e.name)) {
      return [
        await this.inflowFromInfo(
          e,
          e.args.account.toLowerCase(),
          e.name === 'Sow' ? BigInt(e.args.beans) : -BigInt(e.args.beans),
          beanPrice,
          false
        )
      ];
    } else if (e.name === 'PodListingFilled') {
      return [
        await this.inflowFromInfo(e, e.args.filler.toLowerCase(), BigInt(e.args.costInBeans), beanPrice, true),
        await this.inflowFromInfo(e, e.args.lister.toLowerCase(), -BigInt(e.args.costInBeans), beanPrice, true)
      ];
    } else if (e.name === 'PodOrderFilled') {
      return [
        await this.inflowFromInfo(e, e.args.orderer.toLowerCase(), BigInt(e.args.costInBeans), beanPrice, true),
        await this.inflowFromInfo(e, e.args.filler.toLowerCase(), -BigInt(e.args.costInBeans), beanPrice, true)
      ];
    }
  }

  static async inflowFromInfo(e, account, beans, beanPrice, isMarket) {
    return FieldInflowDto.fromData({
      account,
      beans,
      usd: fromBigInt(beans, 6) * beanPrice,
      isMarket,
      block: e.rawLog.blockNumber,
      timestamp: e.extra.timestamp,
      txnHash: e.rawLog.transactionHash
    });
  }
}
module.exports = FieldInflowsTask;
