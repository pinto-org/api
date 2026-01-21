const Contracts = require('../../../datasources/contracts/contracts');
const BlueprintConstants = require('../../../service/tractor/blueprints/blueprint-constants');
const { fromBigInt } = require('../../../utils/number');

class SowExecutionDto {
  constructor(type, d) {
    if (type === 'data') {
      const { baseExecutionDto, innerEvents } = d;
      const sowEvt = innerEvents.find((e) => e.name === 'Sow');
      const sowReferralEvt = innerEvents.find((e) => e.name === 'SowReferral');

      this.id = baseExecutionDto.id;
      this.blueprintHash = baseExecutionDto.blueprintHash;
      this.index = BigInt(sowEvt.args.index);
      this.beans = BigInt(sowEvt.args.beans);
      this.pods = BigInt(sowEvt.args.pods);
      // Fields initialized as nulls need async, will be set outside
      this.placeInLine = null;
      this.usedTokens = null;
      this.usedGrownStalkPerBdv = null;
      if (sowReferralEvt) {
        this.referrer = sowReferralEvt.args.referrer;
        this.referrerPods = BigInt(sowReferralEvt.args.referrerPods);
        this.referrerPlaceInLine = null;
        this.refereePods = BigInt(sowReferralEvt.args.refereePods);
        this.refereePlaceInLine = null;
      }
    } else if (type === 'db') {
      this.id = d.id;
      this.blueprintHash = d.blueprintHash;
      this.index = d.index;
      this.beans = d.beans;
      this.pods = d.pods;
      this.placeInLine = d.placeInLine;
      this.usedTokens = d.usedTokenIndices
        .split(',')
        .map(Number)
        .map((index) => BlueprintConstants.tokenIndexReverseMap()[index]);
      this.usedGrownStalkPerBdv = d.usedGrownStalkPerBdv;
      this.referrer = d.referrer;
      this.referrerPods = d.referrerPods;
      this.referrerPlaceInLine = d.referrerPlaceInLine;
      this.refereePods = d.refereePods;
      this.refereePlaceInLine = d.refereePlaceInLine;
    }
  }

  static async fromExecutionContext(sowExecutionContext) {
    const sowExecutionDto = new SowExecutionDto('data', sowExecutionContext);

    // Assign place in line
    const sowEvt = sowExecutionContext.innerEvents.find((e) => e.name === 'Sow');
    const harvestableIndex = await Contracts.getBeanstalk().harvestableIndex(sowEvt.args.fieldId, {
      blockTag: sowEvt.rawLog.blockNumber
    });
    sowExecutionDto.placeInLine = BigInt(sowEvt.args.index) - BigInt(harvestableIndex);

    const sowReferralEvt = sowExecutionContext.innerEvents.find((e) => e.name === 'SowReferral');
    if (sowReferralEvt) {
      sowExecutionDto.referrerPlaceInLine = BigInt(sowReferralEvt.args.referrerIndex) - BigInt(harvestableIndex);
      sowExecutionDto.refereePlaceInLine = BigInt(sowReferralEvt.args.refereeIndex) - BigInt(harvestableIndex);
    }

    // Assign usedTokens, usedGrownStalkPerBdv according to withdraw events
    await sowExecutionDto.determineWithdrawnTokens(sowExecutionContext.innerEvents);

    return sowExecutionDto;
  }

  static fromModel(dbModel) {
    return new SowExecutionDto('db', dbModel);
  }

  async determineWithdrawnTokens(innerEvents) {
    const removeDeposits = innerEvents.filter((e) => ['RemoveDeposits', 'RemoveDeposit'].includes(e.name));

    let totalBdvWithdrawn = 0;
    let totalGrownStalkWithdrawn = 0;
    this.usedTokens = [];
    for (const evt of removeDeposits) {
      const token = evt.args.token.toLowerCase();
      if (!this.usedTokens.includes(token)) {
        this.usedTokens.push(token);
      }
      // Support both RemoveDeposits and RemoveDeposit
      const bdvs = (evt.args.bdvs ?? [evt.args.bdv]).map(BigInt);
      const stems = (evt.args.stems ?? [evt.args.stem]).map(BigInt);
      const stemTip = BigInt(
        await Contracts.getBeanstalk().stemTipForToken(token, { blockTag: evt.rawLog.blockNumber })
      );
      for (let i = 0; i < bdvs.length; i++) {
        totalBdvWithdrawn += fromBigInt(bdvs[i], 6);
        totalGrownStalkWithdrawn += fromBigInt(bdvs[i] * (stemTip - stems[i]), 16);
      }
    }

    this.usedGrownStalkPerBdv = totalGrownStalkWithdrawn / totalBdvWithdrawn;
  }
}

module.exports = SowExecutionDto;
