const { C } = require('../../constants/runtime-constants');
const FilterLogs = require('../../datasources/events/filter-logs');
const TractorSowV0Task = require('./tractor-blueprints/sow-v0');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

const BLUEPRINTS = [TractorSowV0Task];

class TractorTask {
  static async updateTractor() {
    // Find all PublishRequisiton and Tractor events
    const events = await FilterLogs.getBeanstalkEvents(['PublishRequisition', 'Tractor'], 28723812, 28723992);
    const publishRequisitionEvts = events.filter((e) => e.name === 'PublishRequisition');
    const tractorEvts = events.filter((e) => e.name === 'Tractor');

    publishRequisitionEvts.forEach((e) => this.handlePublishRequsition(e));
    tractorEvts.forEach((e) => this.handleTractor(e));

    let i = 0;

    // Run specialized blueprint modules
  }

  static async handlePublishRequsition(event) {
    //
  }

  static async handleTractor(event) {
    // Find all events for the txn and isolate to within log range
  }
}
module.exports = TractorTask;
