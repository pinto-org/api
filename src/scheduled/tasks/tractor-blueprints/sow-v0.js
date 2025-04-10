const { C } = require('../../../constants/runtime-constants');
const Interfaces = require('../../../datasources/contracts/interfaces');
const SowV0OrderDto = require('../../../repository/dto/tractor/SowV0OrderDto');
const { TractorOrderType } = require('../../../repository/postgres/models/types/types');
const TractorService = require('../../../service/tractor-service');

// TODO: consider whether this best lives elsewhere/not as a "Task" being that other logic
// will be relevant. For example, filtering orders or executions (although that will likely be done at repository level)
class TractorSowV0Task {
  static orderType = TractorOrderType.SOW_V0;

  // TractorTask will request periodic update to entities for this blueprint
  static async periodicUpdate(fromBlock, toBlock) {
    // This will check all entities and try to update amountFunded/cascade amounts
  }

  // Invoked upon PublishRequisition. Does nothing if the requision is not of this blueprint type
  static async tryAddRequisition(orderModel, blueprintData) {
    // Decode data
    const sowV0Call = this.decodeBlueprintData(blueprintData);
    if (!sowV0Call) {
      return;
    }

    const dto = SowV0OrderDto.fromBlueprintCalldata({
      blueprintHash: orderModel.blueprintHash,
      sowParams: sowV0Call.args.params.sowParams
    });

    // Insert entity
    await TractorService.updateSowV0Orders([dto]);

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
