const { C } = require('../../constants/runtime-constants');
const SiloEvents = require('../../datasources/events/silo-events');
const DepositDto = require('../../repository/dto/DepositDto');
const DepositService = require('../../service/deposit-service');
const AsyncContext = require('../../utils/async/context');
const AppMetaService = require('../../service/meta-service');
const { percentDiff } = require('../../utils/number');
const Log = require('../../utils/logging');
const SiloService = require('../../service/silo-service');
const TaskRangeUtil = require('../util/task-range');
const IndexingTask = require('./IndexingTask');

// If the BDV has changed by at least these amounts, update lambda stats
const DEFAULT_UPDATE_THRESHOLD = 0.01;
const HOURLY_UPDATE_THRESHOLD = 0.005;
// Maximum number of blocks to process in one invocation
const MAX_BLOCKS = 10000;

class DepositsTask extends IndexingTask {
  // Set by SunriseTask when a new season is encountered. Indicates that all deposits should be updated.
  // This approach would not work if also taking deposit snapshots (this flag/behavior is only triggered in real-time).
  static __seasonUpdate = false;

  static async handleLiveEvent(event) {
    // Deposits task is not currently used for anything, therefore ok to update infrequently
    if (event.name === 'Sunrise') {
      await this.queueExecution();
    }
    // if (['AddDeposit', 'RemoveDeposit', 'RemoveDeposits', 'StalkBalanceChanged'].includes(event.name)) {
    //   await this.queueExecution();
    // }
  }

  // Returns true if the task can be called again immediately
  static async update() {
    const meta = await AppMetaService.getLambdaMeta();
    const { isInitialized, lastUpdate, updateBlock, isCaughtUp } = await TaskRangeUtil.getUpdateInfo(meta, MAX_BLOCKS, {
      // When the diamond is paused, skip processing completely
      skipPausedRange: true
    });
    if (!isInitialized || lastUpdate === updateBlock) {
      Log.info(`Skipping task, has not been initialized yet or last update is the same as the suggested update block.`);
      return false;
    }
    Log.info(`Updating deposits for block range [${lastUpdate}, ${updateBlock}]`);

    const tokenInfos = await SiloService.getWhitelistedTokenInfo({ block: updateBlock, chain: C().CHAIN });

    await AsyncContext.sequelizeTransaction(async () => {
      await DepositsTask.updateDepositsList(lastUpdate + 1, updateBlock, tokenInfos);
      await DepositsTask.updateMowStems(lastUpdate + 1, updateBlock, tokenInfos);
      if (DepositsTask.__seasonUpdate) {
        // Need to update the mowable stalk/seed count on every deposit
        const allDeposits = await DepositService.getAllDeposits();
        allDeposits.forEach((d) => {
          d.setStalkAndSeeds(tokenInfos[d.token]);
          d.updateLambdaStats(d.bdvOnLambda, tokenInfos[d.token]);
        });
        await DepositService.updateDeposits(allDeposits);
      }
      await AppMetaService.setLastDepositUpdate(updateBlock);
    });

    await AsyncContext.sequelizeTransaction(async () => {
      const { lastBdvs } = meta;
      await DepositsTask.updateLambdaOnBdvChanged(
        lastBdvs,
        updateBlock,
        tokenInfos,
        // Uses a looser update threshold once per hour
        DepositsTask.__seasonUpdate ? HOURLY_UPDATE_THRESHOLD : DEFAULT_UPDATE_THRESHOLD
      );
      await AppMetaService.setLastLambdaBdvs(lastBdvs);
    });
    DepositsTask.__seasonUpdate = false;

    // Unknown number of events, this task should be refactrored to retrieve them upfront within this method instead of separately
    return { countEvents: -1, canExecuteAgain: !isCaughtUp };
  }

  // Updates the list of deposits in the database, adding/removing entries as needed
  static async updateDepositsList(fromBlock, toBlock, tokenInfos) {
    const netActivity = await DepositsTask.getNetChange(fromBlock, toBlock);

    // Pull corresponding db entries
    const depositsToRetrieve = [];
    for (const key in netActivity) {
      const elem = key.split('|');
      depositsToRetrieve.push({
        chain: C().CHAIN,
        account: elem[0],
        token: elem[1],
        stem: BigInt(elem[2])
      });
    }
    const deposits = await DepositService.getDepositsIn(depositsToRetrieve);

    const { toUpsert, toDelete } = await DepositsTask.updateDtoList(deposits, netActivity, tokenInfos, toBlock);

    if (toDelete.length > 0) {
      await DepositService.removeDeposits(toDelete);
    }

    // Update lambda stats on the updateable deposits
    if (toUpsert.length > 0) {
      await DepositService.batchUpdateLambdaBdvs(toUpsert, tokenInfos, toBlock);
      await DepositService.updateDeposits(toUpsert);
    }
  }

  // Updates mow stems for all deposits associated with users who have potentially mown.
  static async updateMowStems(fromBlock, toBlock, tokenInfos) {
    const stalkChangeEvents = await SiloEvents.getStalkBalanceChangedEvents(fromBlock, toBlock);
    // Determine what assets each account has deposited and has possibly just mown
    const accountsCriteria = Array.from(new Set(stalkChangeEvents.map((e) => e.account))).map((account) => ({
      account
    }));
    const mownDeposits = await DepositService.getDepositsIn(accountsCriteria);

    // Update mow stem for each
    await DepositService.assignMowStems(mownDeposits, toBlock);
    mownDeposits.forEach((d) => {
      d.setStalkAndSeeds(tokenInfos[d.token]);
      d.updateLambdaStats(d.bdvOnLambda, tokenInfos[d.token]);
    });

    await DepositService.updateDeposits(mownDeposits);
  }

  // Updates lambda bdv stats if the bdv of an asset has changed by more than `updateThreshold` since the last update.
  static async updateLambdaOnBdvChanged(lastBdvs, blockNumber, tokenInfos, updateThreshold) {
    // Check whether bdv of a token has meaningfully changed since the last update
    const tokensToUpdate = [];
    for (const token in tokenInfos) {
      lastBdvs[token] ||= tokenInfos[token].bdv;
      if (percentDiff(lastBdvs[token], tokenInfos[token].bdv) > updateThreshold) {
        tokensToUpdate.push(token);
        lastBdvs[token] = tokenInfos[token].bdv;
      }
    }

    if (tokensToUpdate.length > 0) {
      const tokensCriteria = tokensToUpdate.map((token) => ({ token }));
      const depositsToUpdate = await DepositService.getDepositsIn(tokensCriteria);
      await DepositService.batchUpdateLambdaBdvs(depositsToUpdate, tokenInfos, blockNumber);
      await DepositService.updateDeposits(depositsToUpdate);
    }
  }

  // Gets the set of net deposit activity over this range in token amounts
  static async getNetChange(fromBlock, toBlock) {
    const newEvents = await SiloEvents.getSiloDepositEvents(fromBlock, toBlock);
    const netActivity = {};
    for (const event of newEvents) {
      const key = `${event.account}|${event.token}|${event.stem}`;
      netActivity[key] ||= {
        amount: 0n,
        bdv: 0n
      };
      netActivity[key].amount += BigInt(event.type) * event.amount;
      netActivity[key].bdv += BigInt(event.type) * event.bdv;
    }

    // Filter 0 entries (no net activity)
    for (const key in netActivity) {
      if (netActivity[key].amount === 0n) {
        delete netActivity[key];
      }
    }
    return netActivity;
  }

  // Increase/decrease deposited amounts. Identifies which deposits should be deleted or upserted
  static async updateDtoList(deposits, netActivity, tokenInfos, blockNumber) {
    const toUpsert = [];
    const toDelete = [];
    for (const deposit of deposits) {
      const key = `${deposit.account}|${deposit.token}|${deposit.stem}`;
      deposit.depositedAmount += netActivity[key].amount;
      if (deposit.depositedAmount === 0n) {
        toDelete.push(deposit);
      } else {
        deposit.depositedBdv += netActivity[key].bdv;
        toUpsert.push(deposit);
      }
    }

    // Find new deposits which arent in the db yet
    const depositKeys = new Set(deposits.map((d) => `${d.account}|${d.token}|${d.stem}`));
    const newDeposits = [];
    for (const key in netActivity) {
      if (!depositKeys.has(key)) {
        const newDeposit = new DepositDto();
        newDeposits.push(newDeposit);

        const [account, token, stem] = key.split('|');
        newDeposit.account = account;
        newDeposit.token = token;
        newDeposit.stem = BigInt(stem);
        newDeposit.depositedAmount = netActivity[key].amount;
        newDeposit.depositedBdv = netActivity[key].bdv;
      }
    }

    await DepositService.assignMowStems(newDeposits, blockNumber);
    toUpsert.push(...newDeposits);

    // Update current values
    for (const deposit of toUpsert) {
      deposit.setStalkAndSeeds(tokenInfos[deposit.token]);
    }

    return { toUpsert, toDelete };
  }
}
module.exports = DepositsTask;
