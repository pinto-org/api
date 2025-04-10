const { TractorOrderType } = require('../../../repository/postgres/models/types/types');

class TractorSowV0Task {
  static orderType = TractorOrderType.SOW_V0;

  // TractorTask will request periodic update to entities for this blueprint
  static async periodicUpdate(fromBlock, toBlock) {
    // This will check all entities and try to update amountFunded/cascade amounts
  }

  // Invoked upon PublishRequisition. Does nothing if the requision is not of this blueprint type
  static tryAddRequisition(orderModel, blueprintData) {
    // Decode data
    // Insert entity
    // Return amount of tip offered
    // return 50000n;
  }

  // Invoked upon tractor execution of this blueprint
  static async orderExecuted() {
    // Update entity state values. Check for SowOrderComplete emit also
    // Insert entity?
    // Return amount of tip paid
  }
}
module.exports = TractorSowV0Task;
