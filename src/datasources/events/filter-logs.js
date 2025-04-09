const { C } = require('../../constants/runtime-constants');
const Log = require('../../utils/logging');
const AlchemyUtil = require('../alchemy');
const Interfaces = require('../contracts/interfaces');

class FilterLogs {
  // Retrieves beanstalk events matching the requested names
  static async getBeanstalkEvents(eventNames, fromBlock, toBlock, c = C()) {
    const iBeanstalk = Interfaces.getBeanstalk(c);
    const topics = eventNames.map((n) => iBeanstalk.getEventTopic(n));

    const filter = {
      address: c.BEANSTALK,
      topics: [topics],
      fromBlock,
      toBlock
    };
    const logs = await FilterLogs.safeGetBatchLogs(filter, c);

    const events = logs.map((log) => {
      const parsed = iBeanstalk.parseLog(log);
      parsed.rawLog = log;
      return parsed;
    });
    return events;
  }

  static async safeGetBatchLogs(filter, c = C()) {
    filter = JSON.parse(JSON.stringify(filter));
    let originalTo = filter.toBlock !== 'latest' ? filter.toBlock : (await C().RPC.getBlock()).number;
    let range = originalTo - filter.fromBlock;
    filter.toBlock = 0;

    if (range > 500000) {
      // While it could be retrieved through this method without error, protect against runaway retrievals
      throw new Error(`Excessively large log range requested (${range})`);
    } else if (range < 0) {
      throw new Error(`toBlock must not be less than fromBlock (${filter.fromBlock}, ${originalTo})`);
    }

    let retries = 5;
    const all = [];
    while (filter.toBlock < originalTo) {
      filter.toBlock = Math.min(filter.fromBlock + range, originalTo);
      try {
        const logs = await c.RPC.getLogs(filter);
        all.push(...logs);
        // Log.info(`Got ${logs.length} logs for range [${filter.fromBlock}, ${filter.toBlock}]`);
        // Prepare for next iteration
        filter.fromBlock = filter.toBlock + 1;
      } catch (e) {
        if (--retries <= 0) {
          // Rethrow if errors were not resolved by repeatedly reducing the block range
          throw new Error(
            `safeGetBatchLogs could not retrieve the requested logs. Original error: ${e instanceof Error ? e.message : String(e)}`
          );
        }
        Log.info('WARNING! getLogs failed, reducing block range and retrying...', filter.fromBlock, range);

        // Prepare for next iteration, reset toBlock and decrease the range
        filter.toBlock = 0;
        // Large ranges may initially fail but will eventually reduce
        range = Math.floor(Math.min(range / 2, 25000));
      }
    }
    return all;
  }
}
module.exports = FilterLogs;

if (require.main === module) {
  (async () => {
    await AlchemyUtil.ready('base');
    const events = await FilterLogs.getBeanstalkEvents(
      ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits'],
      22668331,
      23088331,
      // 'latest',
      C('base')
    );
    console.log(events.length);
  })();
}
