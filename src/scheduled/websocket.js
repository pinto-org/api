// Process sitting atop each of the scheduled tasks; Depending on which events are encountered,
// triggers the appropriate task to run immediately. The tasks decide what to do with the provided events;
// the task may decide to wait to process until a larger volume of events is encountered, and may also
// re-retrieve the logs on its own (implementation will vary by task).

const { C } = require('../constants/runtime-constants');
const Contracts = require('../datasources/contracts/contracts');
const { sendWebhookMessage } = require('../utils/discord');
const Log = require('../utils/logging');

// Add other events here to support other tasks.
const EVENT_NAMES = ['PublishRequisition', 'CancelBlueprint', 'Tractor'];

class WebsocketTaskTrigger {
  static async listen(c = C()) {
    const beanstalk = Contracts.getBeanstalk(c);
    const interfaces = [beanstalk.interface];

    const topics = [];
    const ifaceMap = {};
    for (const eventName of EVENT_NAMES) {
      for (const iface of interfaces) {
        const topicHash = iface.getEventTopic(eventName);
        if (topicHash) {
          topics.push(topicHash);
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
      (log) => {
        const parsedLog = ifaceMap[log.topics[0]].parseLog(log);

        console.log(`encountered ${parsedLog.name} log ${log.transactionHash}`);
        // Determine which task(s) to invoke based on the event name.
        // Might need to do so at a delay to prevent hitting the reorg protection?
        // Or just always call into the task immediately and let that executor decide what to do?

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

// TODO: underlying executors will keep getting invoked by the cron task, if they have already executed within the last interval,
// it is unnecessary to process again.
