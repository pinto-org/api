const { C } = require('../../constants/runtime-constants');
const retryable = require('../../utils/async/retryable');
const EnvUtil = require('../../utils/env');

class TaskRangeUtil {
  // meta: has a `lastUpdate` property
  // maxReturnBlock: the maximum block number to return
  // maxBlocksAtOnce: the maximum number of blocks to update at once
  // skipPausedRange: whether to skip over any block range where the diamond was paused
  static async getUpdateInfo(meta, maxBlocksAtOnce, { maxReturnBlock, skipPausedRange } = {}) {
    let lastUpdate = meta.lastUpdate;
    if (lastUpdate === null) {
      return { isInitialized: false };
    }

    let isCaughtUp = true;

    // Determine range of blocks to update on
    let updateBlock = (await retryable(() => C().RPC.getBlock())).number;
    // Buffer to avoid issues with a chain reorg on non-local rpc
    // if (!EnvUtil.isLocalRpc(C().CHAIN)) {
    //   updateBlock -= ChainUtil.blocksPerInterval(C().CHAIN, 10000);
    // }
    if (updateBlock - lastUpdate > maxBlocksAtOnce) {
      updateBlock = lastUpdate + maxBlocksAtOnce;
      isCaughtUp = false;
    }

    if (maxReturnBlock !== undefined && updateBlock > maxReturnBlock) {
      updateBlock = maxReturnBlock;
      isCaughtUp = false;
    }

    if (skipPausedRange) {
      for (const [pauseBlock, unpauseBlock] of C().MILESTONE.pauseBlocks) {
        if (lastUpdate < pauseBlock - 1 && updateBlock >= pauseBlock) {
          // Pause has occurred, needs to update through before the pause
          updateBlock = pauseBlock - 1;
        } else if (lastUpdate === pauseBlock - 1) {
          // Processing is positioned to skip the paused time period. In practice the unpause block for each pause is always known.
          // This is because any pause will crash/stall the indexer, and it wont make sense to resume it until after the unpause.
          lastUpdate = unpauseBlock;
          updateBlock = unpauseBlock + 1;
        }
      }
    }

    // Cap the indexer progression if configured (indexing environment may want to stop at a specific block)
    updateBlock = Math.min(updateBlock, EnvUtil.getIndexingStopBlock());

    return {
      isInitialized: true,
      lastUpdate,
      updateBlock,
      isCaughtUp,
      meta
    };
  }
}
module.exports = TaskRangeUtil;
