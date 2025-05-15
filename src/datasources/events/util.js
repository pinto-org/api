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
    const blockNumbers = new Set(events.map((e) => e.rawLog.blockNumber));
    const timestamps = {};

    const TAG = Concurrent.tag('eventTimestamps');
    for (const b of blockNumbers) {
      await Concurrent.run(TAG, 50, async () => {
        const block = await C().RPC.getBlock(b);
        timestamps[b] = new Date(Number(block.timestamp) * 1000);
      });
    }
    await Concurrent.allResolved(TAG);

    for (const e of events) {
      (e.extra ??= {}).timestamp = timestamps[e.rawLog.blockNumber];
    }
  }
}
module.exports = EventsUtils;
