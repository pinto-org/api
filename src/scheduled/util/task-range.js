const { C } = require('../../constants/runtime-constants');
const ChainUtil = require('../../utils/chain');
const Log = require('../../utils/logging');

class TaskRangeUtil {
  // metaFunction: async function that has a `lastUpdate` property
  static async getUpdateInfo(metaFunction, maxUpdateBlocks) {
    const meta = await metaFunction();
    if (meta.lastUpdate === null) {
      return { isInitialized: false };
    }

    let isCaughtUp = true;

    // Determine range of blocks to update on
    const currentBlock = (await C().RPC.getBlock()).number;
    // Buffer to avoid issues with a chain reorg
    let updateBlock = currentBlock - ChainUtil.blocksPerInterval(C().CHAIN, 10000);
    if (updateBlock - meta.lastUpdate > maxUpdateBlocks) {
      updateBlock = meta.lastUpdate + maxUpdateBlocks;
      isCaughtUp = false;
    }

    return {
      isInitialized: true,
      lastUpdate: meta.lastUpdate,
      updateBlock,
      isCaughtUp,
      meta
    };
  }
}
module.exports = TaskRangeUtil;
