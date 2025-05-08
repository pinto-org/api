const { C } = require('../../constants/runtime-constants');
const Concurrent = require('../../utils/async/concurrent');

class EventsUtils {
  // Group events by transaction
  static async groupByTransaction(events) {
    const grouped = {};
    for (const e of events) {
      (grouped[e.rawLog.transactionHash] ??= []).push(e);
    }
    return grouped;
  }

  // Attach block timestamps to each event
  static async attachTimestamps(events) {
    const TAG = Concurrent.tag('eventTimestamps');
    for (const e of events) {
      await Concurrent.run(TAG, 50, async () => {
        const block = C().RPC.getBlock(e.rawLog.blockNumber);
        (e.extra ??= {}).timestamp = new Date(Number(block.timestamp) * 1000);
      });
    }
    await Concurrent.allResolved(TAG);
  }
}
module.exports = EventsUtils;
