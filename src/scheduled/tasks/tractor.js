const { C } = require('../../constants/runtime-constants');
const FilterLogs = require('../../datasources/events/filter-logs');
const TractorOrderDto = require('../../repository/dto/TractorOrderDto');
const AppMetaService = require('../../service/meta-service');
const Log = require('../../utils/logging');
const TaskRangeUtil = require('../util/task-range');
const TractorSowV0Task = require('./tractor-blueprints/sow-v0');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

const BLUEPRINTS = [TractorSowV0Task];

class TractorTask {
  static async updateTractor() {
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(
      AppMetaService.getTractorMeta,
      MAX_BLOCKS
    );
    if (!isInitialized) {
      Log.info(`Skipping task, has not been initializd yet.`);
      return;
    }
    Log.info(`Updating tractor for block range [${lastUpdate}, ${updateBlock}]`);

    // Find all PublishRequisiton and Tractor events
    const events = await FilterLogs.getBeanstalkEvents(['PublishRequisition', 'Tractor'], 28723812, 28723992);
    // const events = await FilterLogs.getBeanstalkEvents(['PublishRequisition', 'Tractor'], lastUpdate, updateBlock); // TODO: put back
    const publishRequisitionEvts = events.filter((e) => e.name === 'PublishRequisition');
    const tractorEvts = events.filter((e) => e.name === 'Tractor');

    publishRequisitionEvts.forEach((e) => this.handlePublishRequsition(e));
    tractorEvts.forEach((e) => this.handleTractor(e));

    let i = 0;

    // Run specialized blueprint modules

    return isCaughtUp;
  }

  static async handlePublishRequsition(event) {
    const dto = await TractorOrderDto.fromRequisitionEvt(event);
    // TODO: need to pass order entity here after it gets created
    BLUEPRINTS.forEach((b) => b.tryAddRequisition(event.args.requisition.blueprint.data));
  }

  static async handleTractor(event) {
    // Find all events for the txn and isolate to within log range
  }
}
module.exports = TractorTask;
