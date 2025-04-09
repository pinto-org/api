// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

class TractorTask {
  static async updateTractor() {
    // Find all PublishRequisiton and Tractor events
    // For tractor event, find all events for the txn and isolate to within log range
    // Run specialized blueprint modules
  }
}
module.exports = TractorTask;
