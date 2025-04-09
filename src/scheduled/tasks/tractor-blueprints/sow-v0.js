class TractorSowV0Task {
  // TractorTask will request periodic update to entities for this blueprint
  static async periodicUpdate() {
    // param: block number range?
    // This will check all entities and try to update amountFunded/cascade amounts
  }

  // Invoked upon PublishRequisition. Does nothing if the requision is not of this blueprint type
  static tryAddRequisition() {
    // Decode data
    // Insert entity
    // Return amount of tip offered
  }

  // Invoked upon tractor execution of this blueprint
  static async orderExecuted() {
    // Update entity state values. Check for SowOrderComplete emit also
    // Return amount of tip paid
  }
}
module.exports = TractorSowV0Task;
