const { C } = require('../../constants/runtime-constants');
const FilterLogs = require('../../datasources/events/filter-logs');
const TractorOrderDto = require('../../repository/dto/TractorOrderDto');
const AppMetaService = require('../../service/meta-service');
const TractorService = require('../../service/tractor-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
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

    // TODO: verify events sorted?
    await AsyncContext.sequelizeTransaction(async () => {
      const TAG = Concurrent.tag('processTractorEvt');
      for (const event of events) {
        await Concurrent.run(TAG, 50, async () => {
          if (event.name === 'PublishRequisition') {
            this.handlePublishRequsition(event);
          } else if (event.name === 'Tractor') {
            this.handleTractor(event);
          }
        });
      }
      await Concurrent.allResolved(TAG);
    });

    // Run specialized blueprint modules

    return isCaughtUp;
  }

  static async handlePublishRequsition(event) {
    const dto = await TractorOrderDto.fromRequisitionEvt(event);
    const orders = await TractorService.updateOrders([dto]);

    // TODO: need to pass order entity here after it gets created
    BLUEPRINTS.forEach((b) => b.tryAddRequisition(event.args.requisition.blueprint.data));
  }

  static async handleTractor(event) {
    // Find all events for the txn and isolate to within log range
  }
}
module.exports = TractorTask;
