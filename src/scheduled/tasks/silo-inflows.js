const { C } = require('../../constants/runtime-constants');
const DepositEvents = require('../../datasources/events/deposit-events');
const FilterLogs = require('../../datasources/events/filter-logs');
const EventsUtils = require('../../datasources/events/util');
const SiloInflowDto = require('../../repository/dto/inflow/SiloInflowDto');
const AppMetaService = require('../../service/meta-service');
const PriceService = require('../../service/price-service');
const SiloInflowService = require('../../service/inflow/silo-inflow-service');
const SiloService = require('../../service/silo-service');
const Concurrent = require('../../utils/async/concurrent');
const AsyncContext = require('../../utils/async/context');
const Log = require('../../utils/logging');
const { bigintFloatMultiplier, fromBigInt, toBigInt } = require('../../utils/number');
const TaskRangeUtil = require('../util/task-range');
const SiloInflowSnapshotService = require('../../service/inflow/silo-inflow-snapshot-service');

// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

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

    const events = await FilterLogs.getBeanstalkEvents(
      ['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'Plant', 'Convert', 'ClaimPlenty'],
      {
        fromBlock: lastUpdate + 1,
        toBlock: updateBlock
      }
    );

    await EventsUtils.attachTimestamps(events);

    const inflowDtos = [];

    // Group events by transaction
    const TAG = Concurrent.tag('siloInflowTxns');
    const grouped = await EventsUtils.groupByTransaction(events);
    for (const txnHash in grouped) {
      await Concurrent.run(TAG, 25, async () => {
        const txnEvents = grouped[txnHash];
        const converts = txnEvents.filter((e) => e.name === 'Convert');
        const plants = txnEvents.filter((e) => e.name === 'Plant');
        const addRemoves = txnEvents.filter((e) => e.name.includes('Deposit'));

        // Ignore add/removal matching convert or pick
        DepositEvents.removeConvertRelatedEvents(addRemoves, converts);
        DepositEvents.removePlantRelatedEvents(addRemoves, plants);

        // Determine net of add/remove
        const netDeposits = DepositEvents.netDeposits(addRemoves);
        inflowDtos.push(
          ...(await this.inflowsFromNetDeposits(netDeposits, {
            block: txnEvents[0].rawLog.blockNumber,
            timestamp: txnEvents[0].extra.timestamp,
            txnHash
          }))
        );

        // Record outflows from claim plenty
        const claimPlenties = txnEvents.filter((e) => e.name === 'ClaimPlenty');
        inflowDtos.push(
          ...(await this.inflowsFromClaimPlenties(claimPlenties, {
            block: txnEvents[0].rawLog.blockNumber,
            timestamp: txnEvents[0].extra.timestamp,
            txnHash
          }))
        );
      });
    }
    await Concurrent.allResolved(TAG);

    // Save new entities
    await AsyncContext.sequelizeTransaction(async () => {
      await SiloInflowService.insertInflows(inflowDtos);
      await SiloInflowSnapshotService.takeMissingSnapshots(updateBlock);
      await AppMetaService.setLastSiloInflowUpdate(updateBlock);
    });

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
          isPlenty: false,
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
    const signs = [];
    for (const dto of dtos) {
      bdvsCalldata.tokens.push(dto.token);
      bdvsCalldata.amounts.push(dto.amount * signs[signs.push(dto.amount > 0n ? 1n : -1n) - 1]);
    }
    const [instBdvs, beanPrice] = await Promise.all([
      SiloService.batchBdvs(bdvsCalldata, block),
      PriceService.getBeanPrice({ blockNumber: block })
    ]);

    for (let i = 0; i < dtos.length; ++i) {
      dtos[i].assignInstValues(instBdvs[i] * signs[i], beanPrice.usdPrice);
    }
  }

  static async inflowsFromClaimPlenties(claimPlenties, { block, timestamp, txnHash }) {
    // Price the value and bdvs of all claimed tokens
    const tokens = claimPlenties.map((e) => e.args.token.toLowerCase());
    const [beanPrice, ...tokenPrices] = (
      await Promise.all([C().BEAN, ...tokens].map((t) => PriceService.getTokenPrice(t, { blockNumber: block })))
    ).map((p) => p.usdPrice);
    const pseudoBdvs = tokenPrices.map((p) => p / beanPrice);

    const dtos = [];
    for (let i = 0; i < claimPlenties.length; ++i) {
      const e = claimPlenties[i];
      const dto = SiloInflowDto.fromData({
        account: e.args.account.toLowerCase(),
        token: e.args.token.toLowerCase(),
        amount: -BigInt(e.args.plenty),
        isTransfer: false,
        isPlenty: true,
        block,
        timestamp,
        txnHash
      });
      const tokenAmount = fromBigInt(-BigInt(e.args.plenty), C().DECIMALS[e.args.token.toLowerCase()]);
      dto.assignInstValues(toBigInt(pseudoBdvs[i] * tokenAmount, 6), beanPrice);
      dtos.push(dto);
    }
    return dtos;
  }
}
module.exports = SiloInflowsTask;
