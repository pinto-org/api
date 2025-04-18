const { C } = require('../../constants/runtime-constants');
const Log = require('../../utils/logging');
const AlchemyUtil = require('../alchemy');
const Contracts = require('../contracts/contracts');

class FilterLogs {
  // Retrieves beanstalk events matching the requested names
  static async getBeanstalkEvents(eventNames, fromBlock, toBlock, c = C()) {
    return this.getEvents(Contracts.getBeanstalk(c), eventNames, fromBlock, toBlock, c);
  }

  // Retrieves beanstalk events from a specific transaction
  static async getBeanstalkTransactionEvents(receipt, c = C()) {
    return this.getTransactionEvents([Contracts.getBeanstalk(c)], receipt);
  }

  static async getEvents(contract, eventNames, fromBlock, toBlock, c = C()) {
    const iface = contract.interface;
    const topics = eventNames.map((n) => iface.getEventTopic(n));

    const filter = {
      address: contract.address,
      topics: [topics],
      fromBlock,
      toBlock
    };
    const logs = await FilterLogs.safeGetBatchLogs(filter, c);

    const events = logs.map((log) => {
      const parsed = iface.parseLog(log);
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

  // Gets all events from specific transactions to the given contract(s)
  static async getTransactionEvents(contracts, receipt) {
    const contractsByAddress = contracts.reduce((acc, next) => {
      acc[next.address.toLowerCase()] = next;
      return acc;
    }, {});

    // Filter logs and parse them using the address mapping
    const events = receipt.logs
      .filter((log) => !!contractsByAddress[log.address.toLowerCase()])
      .map((log) => {
        const contract = contractsByAddress[log.address.toLowerCase()];
        try {
          const parsed = contract.interface.parseLog(log);
          parsed.rawLog = log;
          return parsed;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    return events;
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
