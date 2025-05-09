const { C } = require('../../constants/runtime-constants');
const DepositEvents = require('../../datasources/events/deposit-events');
const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const SiloInflowDto = require('../../repository/dto/SiloInflowDto');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const SiloService = require('../../service/silo-service');
const Log = require('../../utils/logging');
const { toBigInt, fromBigInt, bigintFloatMultiplier } = require('../../utils/number');
const TaskRangeUtil = require('../util/task-range');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 2000;

class SiloInflowsTask {
  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getSiloInflowMeta();
    let { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS);
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating silo inflows for block range [${lastUpdate}, ${updateBlock}]`);

    // Test range includes convert, withdrawal, and withdrawal to sow
    const events = await FilterLogs.getBeanstalkEvents(
      ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'Plant', 'Convert'],
      {
        // contains convert
        // fromBlock: 29958513, /////
        // toBlock: 29958578 /////
        // contains plant
        // fromBlock: 22650525, /////
        // toBlock: 22651999 /////
        // contains transfer
        fromBlock: 22651930,
        toBlock: 22651932
      }
    );

    await EventsUtils.attachTimestamps(events);

    const inflowDtos = [];

    // Group events by transaction
    const grouped = await EventsUtils.groupByTransaction(events);
    for (const txnHash in grouped) {
      const events = grouped[txnHash];
      const converts = events.filter((e) => e.name === 'Convert');
      const plants = events.filter((e) => e.name === 'Plant');
      const addRemoves = events.filter((e) => e.name.includes('Deposit'));

      // Ignore add/removal matching convert or pick
      DepositEvents.removeConvertRelatedEvents(addRemoves, converts);
      DepositEvents.removePlantRelatedEvents(addRemoves, plants);

      // Determine net of add/remove
      const netDeposits = DepositEvents.netDeposits(addRemoves);
      inflowDtos.push(
        ...(await this.inflowsFromNetDeposits(netDeposits, {
          block: events[0].rawLog.blockNumber,
          timestamp: events[0].extra.timestamp,
          txnHash
        }))
      );
    }

    return !isCaughtUp;
  }

  // Construct new silo inflow dtos from net deposits in this transaction
  static async inflowsFromNetDeposits(netDeposits, { block, timestamp, txnHash }) {
    const dtos = [];
    for (const token in netDeposits) {
      const p = C().DECIMALS[token];
      for (const account in netDeposits[token]) {
        const deposit = netDeposits[token][account];
        const transfer = deposit.transferPct > 0;
        const partialTransfer = transfer && deposit.transferPct < 1;
        const data = {
          account,
          token,
          block,
          timestamp,
          txnHash
        };
        if (!partialTransfer) {
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: deposit.amount,
              isTransfer: transfer
            })
          );
        } else {
          // If this was partially transferred, needs to split into two entries
          const transferAmount = bigintFloatMultiplier(deposit.amount, p, deposit.transferPct);
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: transferAmount,
              isTransfer: true
            })
          );
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: deposit.amount - transferAmount,
              isTransfer: false
            })
          );
        }
      }
    }

    // Assign all bdvs and usd values
    await this.assignInflowBdvAndUsd(dtos, block);

    return dtos;
  }

  // Uses bdv batching view function to get many/all bdvs at once for this transaction
  static async assignInflowBdvAndUsd(dtos, block) {
    const bdvsCalldata = {
      tokens: [],
      amounts: []
    };
    for (const dto of dtos) {
      bdvsCalldata.tokens.push(dto.token);
      bdvsCalldata.amounts.push(dto.amount);
    }
    const [instBdvs, beanPrice] = await Promise.all([
      SiloService.batchBdvs(bdvsCalldata, block),
      PriceService.getBeanPrice({ blockNumber: block })
    ]);

    for (let i = 0; i < dtos.length; ++i) {
      dtos[i].assignInstValues(instBdvs[i], beanPrice.usdPrice);
    }
  }
}
module.exports = SiloInflowsTask;
