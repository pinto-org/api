const { C } = require('../../constants/runtime-constants');
const ChainUtil = require('../../utils/chain');

class TaskRangeUtil {
  // meta: has a `lastUpdate` property
  // maxReturnBlock: the maximum block number to return
  // maxBlocksAtOnce: the maximum number of blocks to update at once
  static async getUpdateInfo(meta, maxBlocksAtOnce, { maxReturnBlock } = {}) {
    if (meta.lastUpdate === null) {
      return { isInitialized: false };
    }

    let isCaughtUp = true;

    // Determine range of blocks to update on
    const currentBlock = (await C().RPC.getBlock()).number;
    // Buffer to avoid issues with a chain reorg
    let updateBlock = currentBlock - ChainUtil.blocksPerInterval(C().CHAIN, 10000);
    if (updateBlock - meta.lastUpdate > maxBlocksAtOnce) {
      updateBlock = meta.lastUpdate + maxBlocksAtOnce;
      isCaughtUp = false;
    }

    if (maxReturnBlock !== undefined && updateBlock > maxReturnBlock) {
      updateBlock = maxReturnBlock;
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
