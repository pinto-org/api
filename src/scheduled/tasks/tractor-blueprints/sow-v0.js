const { C } = require('../../../constants/runtime-constants');
const Interfaces = require('../../../datasources/contracts/interfaces');
const SowOrderV0Dto = require('../../../repository/dto/tractor/SowOrderV0Dto');
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
    const sowV0Call = this.decodeBlueprintData(blueprintData);
    const dto = SowOrderV0Dto.fromBlueprintCalldata(sowV0Call);
    // Insert entity
    // Return amount of tip offered
    return sowV0Call.args.params.opParams.operatorTipAmount;
  }

  // Invoked upon tractor execution of this blueprint
  static async orderExecuted() {
    // Update entity state values. Check for SowOrderComplete emit also
    // Insert entity?
    // Return amount of tip paid
  }

  // If possible, decodes blueprint data into the sowBlueprintv0 call
  static decodeBlueprintData(blueprintData) {
    const iBeanstalk = Interfaces.getBeanstalk();
    const iSowV0 = Interfaces.get(C().SOW_V0);

    const advFarm = Interfaces.safeParseTxn(iBeanstalk, blueprintData);
    if (!advFarm || advFarm.name !== 'advancedFarm') {
      return;
    }

    for (const advFarmData of advFarm.args.data) {
      const advFarmCall = Interfaces.safeParseTxn(iBeanstalk, advFarmData.callData);
      if (advFarmCall.name !== 'advancedPipe') {
        return;
      }

      for (const pipeCall of advFarmCall.args.pipes) {
        if (pipeCall.target.toLowerCase() !== C().SOW_V0) {
          return;
        }
        return Interfaces.safeParseTxn(iSowV0, pipeCall.callData);
      }
    }
  }
}
module.exports = TractorSowV0Task;
