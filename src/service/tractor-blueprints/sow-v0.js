const { C } = require('../../constants/runtime-constants');
const Contracts = require('../../datasources/contracts/contracts');
const Interfaces = require('../../datasources/contracts/interfaces');
const InputError = require('../../error/input-error');
const SowV0OrderDto = require('../../repository/dto/tractor/SowV0OrderDto');
const { sequelize, Sequelize } = require('../../repository/postgres/models');
const SowV0ExecutionAssembler = require('../../repository/postgres/models/assemblers/tractor/tractor-execution-sow-v0-assembler');
const SowV0OrderAssembler = require('../../repository/postgres/models/assemblers/tractor/tractor-order-sow-v0-assembler');
const { TractorOrderType } = require('../../repository/postgres/models/types/types');
const { fromBigInt } = require('../../utils/number');
const PriceService = require('../price-service');
const Blueprint = require('./blueprint');

class TractorSowV0Service extends Blueprint {
  static orderType = TractorOrderType.SOW_V0;
  static orderModel = sequelize.models.TractorOrderSowV0;
  static orderAssembler = SowV0OrderAssembler;
  static executionModel = sequelize.models.TractorExecutionSowV0;
  static executionAssembler = SowV0ExecutionAssembler;

  // TractorTask will request periodic update to entities for this blueprint
  static async periodicUpdate(fromBlock, toBlock) {
    // This will check all entities and try to update amountFunded/cascade amounts
    // Verify not cancelled (order level) or completed (blueprint level)
  }

  // Invoked upon PublishRequisition. Does nothing if the requision is not of this blueprint type
  static async tryAddRequisition(orderDto, blueprintData) {
    // Decode data
    const sowV0Call = this.decodeBlueprintData(blueprintData);
    if (!sowV0Call) {
      return;
    }

    const dto = SowV0OrderDto.fromBlueprintCalldata({
      blueprintHash: orderDto.blueprintHash,
      sowParams: sowV0Call.args.params.sowParams
    });

    // Insert entity
    await this.updateOrders([dto]);

    // Return amount of tip offered
    return sowV0Call.args.params.opParams.operatorTipAmount;
  }

  // Invoked upon tractor execution of this blueprint
  static async orderExecuted(orderDto, executionDto, innerEvents) {
    // Update current order entity state
    const sowOrder = await this.getOrder(orderDto.blueprintHash);

    const sowEvt = innerEvents.find((e) => e.name === 'Sow');
    sowOrder.pintoSownCounter += BigInt(sowEvt.args.beans);
    sowOrder.lastExecutedSeason = Number(
      await Contracts.getBeanstalk().season({ blockTag: sowEvt.rawLog.blockNumber })
    );
    sowOrder.orderComplete = !!innerEvents.find((e) => e.name === 'SowOrderComplete');
    await this.updateOrders([sowOrder]);

    // Insert execution entity?
    // await this.updateExecutions([executionDto]);

    // Return amount of tip paid in usd
    const operatorReward = innerEvents.find((e) => e.name === 'OperatorReward');
    if (operatorReward.args.token.toLowerCase() === C().BEAN) {
      const beanPrice = await PriceService.getBeanPrice({ blockNumber: operatorReward.rawLog.blockNumber });
      const tipUsd = fromBigInt(BigInt(operatorReward.args.amount), 6) * beanPrice.usdPrice;
      return tipUsd;
    }
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

  // Validates the blueprint-specific params for the order request
  static validateOrderParams(blueprintParams) {
    if (blueprintParams.orderComplete !== undefined && typeof blueprintParams.orderComplete !== 'boolean') {
      throw new InputError('orderComplete must be a boolean');
    }
  }

  // Returns a where clause used to filter on the blueprint order model
  static orderRequestParams(blueprintParams) {
    const where = {};
    if (blueprintParams) {
      if (blueprintParams.orderComplete !== undefined) {
        where.orderComplete = { [Sequelize.Op.eq]: blueprintParams.orderComplete };
      }
    }
    return where;
  }
}
module.exports = TractorSowV0Service;
