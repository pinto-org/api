const { C } = require('../../constants/runtime-constants');
const { BigInt_abs } = require('../../utils/bigint');
const Log = require('../../utils/logging');
const { fromBigInt, bigintFloatMultiplier, bigintPercent } = require('../../utils/number');
const AlchemyUtil = require('../alchemy');
const FilterLogs = require('./filter-logs');

const DEPOSIT_EVENTS = ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits'];

class SiloEvents {
  // Returns a summary of add/remove deposit events
  static async getSiloDepositEvents(fromBlock, toBlock = 'latest') {
    const events = await FilterLogs.getBeanstalkEvents(DEPOSIT_EVENTS, { fromBlock, toBlock });
    return this.collapseDepositEvents(events);
  }

  // Collapses RemoveDeposits out of its array form
  static collapseDepositEvents(events) {
    const collapsed = [];
    for (const e of events) {
      if (e.name === 'RemoveDeposits') {
        for (let i = 0; i < e.args.stems.length; ++i) {
          collapsed.push({
            type: -1,
            account: e.args.account.toLowerCase(),
            token: e.args.token.toLowerCase(),
            stem: BigInt(e.args.stems[i]),
            amount: BigInt(e.args.amounts[i]),
            bdv: BigInt(e.args.bdvs[i])
          });
        }
      } else {
        collapsed.push({
          type: e.name === 'AddDeposit' ? 1 : -1,
          account: e.args.account.toLowerCase(),
          token: e.args.token.toLowerCase(),
          stem: BigInt(e.args.stem),
          amount: BigInt(e.args.amount),
          bdv: BigInt(e.args.bdv)
        });
      }
    }
    return collapsed;
  }

  // Returns condensed info from StalkBalanceChanged
  static async getStalkBalanceChangedEvents(fromBlock, toBlock = 'latest') {
    const rawEvents = await FilterLogs.getBeanstalkEvents(['StalkBalanceChanged'], { fromBlock, toBlock });
    const summary = [];
    for (const event of rawEvents) {
      summary.push({
        account: event.args.account.toLowerCase(),
        deltaStalk: BigInt(event.args.delta),
        blockNumber: event.rawLog.blockNumber
      });
    }
    return summary;
  }

  static removeConvertRelatedEvents(addRemoveEvents, convertEvents) {
    for (const convert of convertEvents) {
      const removeDepositIndex = addRemoveEvents.findIndex(
        (e) =>
          e.name.includes('Remove') &&
          e.args.account === convert.args.account &&
          e.args.token === convert.args.fromToken &&
          BigInt(e.args.amount) === BigInt(convert.args.fromAmount)
      );
      const addDepositIndex = addRemoveEvents.findIndex(
        (e) =>
          e.name.includes('Add') &&
          e.args.account === convert.args.account &&
          e.args.token === convert.args.toToken &&
          BigInt(e.args.amount) === BigInt(convert.args.toAmount)
      );
      if (removeDepositIndex !== -1 && addDepositIndex !== -1) {
        addRemoveEvents.splice(Math.max(removeDepositIndex, addDepositIndex), 1);
        addRemoveEvents.splice(Math.min(removeDepositIndex, addDepositIndex), 1);
      } else {
        Log.info(`Convert in ${convert.rawLog?.transactionHash} failed to match add/remove deposit(s)`);
      }
    }
  }

  static removePlantRelatedEvents(addRemoveEvents, plantEvents) {
    // Output an error if Plant doesnt match with add deposit
    for (const plant of plantEvents) {
      const addDepositIndex = addRemoveEvents.findIndex(
        (e) =>
          e.name.includes('Add') &&
          e.args.account === plant.args.account &&
          BigInt(e.args.amount) === BigInt(plant.args.beans) &&
          e.args.token.toLowerCase() === C().BEAN.toLowerCase()
      );
      if (addDepositIndex !== -1) {
        addRemoveEvents.splice(addDepositIndex, 1);
      } else {
        Log.info(`Plant in ${plant.rawLog?.transactionHash} failed to match add deposit`);
      }
    }
  }
}
module.exports = SiloEvents;

if (require.main === module) {
  (async () => {
    await AlchemyUtil.ready('base');
    // const logs = await SiloEvents.getSiloDepositEvents(264547404);
    // console.log(logs.filter((l) => l.name === 'AddDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposit')[0]);
    // console.log(logs.filter((l) => l.name === 'RemoveDeposits')[0].args.stems);
    // console.log(await SiloEvents.getSiloDepositEvents(264547404));
    console.log(await SiloEvents.getStalkBalanceChangedEvents(25600457, 25602057));
  })();
}
