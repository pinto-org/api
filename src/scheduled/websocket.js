// Process sitting atop each of the scheduled tasks; Depending on which events are encountered,
// triggers the appropriate task to run immediately. The tasks decide what to do with the provided events;
// the task may decide to wait to process until a larger volume of events is encountered, and may also
// re-retrieve the logs on its own (implementation will vary by task).

const { C } = require('../constants/runtime-constants');
const Beanstalk = require('../datasources/contracts/upgradeable/beanstalk');
const SeasonService = require('../service/season-service');
const { sendWebhookMessage } = require('../utils/discord');
const Log = require('../utils/logging');
const DepositsTask = require('./tasks/deposits');
const InflowsTask = require('./tasks/inflows');
const TractorTask = require('./tasks/tractor');

// These events will be listened for, and the corresponding tasks notified when encountered.
const EVENT_TASKS = {
  Sunrise: [DepositsTask, InflowsTask, TractorTask],
  PublishRequisition: [TractorTask],
  CancelBlueprint: [TractorTask],
  Tractor: [TractorTask],
  AddDeposit: [DepositsTask, InflowsTask, TractorTask],
  RemoveDeposit: [DepositsTask, InflowsTask, TractorTask],
  RemoveDeposits: [DepositsTask, InflowsTask, TractorTask],
  StalkBalanceChanged: [DepositsTask],
  Sow: [InflowsTask],
  Harvest: [InflowsTask],
  PodListingFilled: [InflowsTask],
  PodOrderFilled: [InflowsTask],
  Plant: [InflowsTask],
  Convert: [InflowsTask],
  ClaimPlenty: [InflowsTask]
};

class WebsocketTaskTrigger {
  static async listen(c = C()) {
    const interfaces = Beanstalk.getAllInterfaces(c);

    const topics = [];
    const ifaceMap = {};
    for (const eventName in EVENT_TASKS) {
      for (const iface of interfaces) {
        const topicHash = iface.getEventTopic(eventName);
        if (topicHash) {
          topics.push(topicHash);
          // If multiple interfaces have the same name/topicHash mapping, doesn't matter which interface is used.
          ifaceMap[topicHash] = iface;
        }
      }
    }

    Log.info(`Websocket activated for task events`);

    c.WS.on(
      {
        address: [c.BEANSTALK],
        topics: [topics]
      },
      async (log) => {
        const parsedLog = ifaceMap[log.topics[0]].parseLog(log);
        parsedLog.rawLog = log;

        if (log.name === 'Sunrise') {
          await SeasonService.handleSunrise(parsedLog);
        }

        console.log(`encountered ${parsedLog.name} log ${log.transactionHash}`);
        for (const task of EVENT_TASKS[parsedLog.name]) {
          if (task.isCaughtUp()) {
            task.handleLiveEvent(parsedLog);
          }
        }

        if (log.removed) {
          // If this occurs in practice, we may need to start handling it if the underlying task executors
          // are not reorg-resistant.
          sendWebhookMessage(
            `Chain reorg encountered at block ${log.blockNumber}? ${parsedLog.name} log was removed (${log.transactionHash})`
          );
        }
      }
    );
  }
}
module.exports = WebsocketTaskTrigger;
