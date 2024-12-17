const { C } = require('../../constants/runtime-constants');
const AlchemyUtil = require('../alchemy');
const Contracts = require('../contracts/contracts');

class FilterLogs {
  // Retrieves beanstalk events matching the requested names
  static async getBeanstalkEvents(eventNames, fromBlock, toBlock, c = C()) {
    const iBeanstalk = Contracts.getBeanstalk(c).interface;
    const topics = eventNames.map((n) => iBeanstalk.getEventTopic(n));

    const filter = {
      address: c.BEANSTALK,
      topics: [topics],
      fromBlock,
      toBlock
    };

    const logs = await c.RPC.getLogs(filter);
    const events = logs.map((log) => {
      const parsed = iBeanstalk.parseLog(log);
      parsed.rawLog = log;
      return parsed;
    });
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
      'latest',
      C('base')
    );
    console.log(events);
  })();
}
