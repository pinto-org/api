const { C } = require('../constants/runtime-constants');
const CommonSubgraphRepository = require('../repository/subgraph/common-subgraph');

class BlockUtil {
  // Returns the block data to use for the given options. Both are optional
  static async blockFromOptions({ blockNumber, timestamp }) {
    let blockTag = blockNumber ?? 'latest';
    if (timestamp) {
      return await BlockUtil.findBlockByTimestamp(timestamp);
    } else {
      return await C().RPC.getBlock(blockTag);
    }
  }

  // Returns the block data to use for the given options,
  // constrained by the maximal indexed block of the given subgraph.
  static async blockForSubgraphFromOptions(subgraphClient, options) {
    const [subgraphMeta, optionsBlock] = await Promise.all([
      CommonSubgraphRepository.getMeta(subgraphClient),
      BlockUtil.blockFromOptions(options)
    ]);
    const blockToUse = Math.min(subgraphMeta.block, optionsBlock.number);

    return await C().RPC.getBlock(blockToUse);
  }

  // Performs a binary search lookup to find the ethereum block number closest to this timestamp
  static async findBlockByTimestamp(timestamp) {
    const provider = C().RPC;
    let upper = await provider.getBlockNumber();
    let lower = 22622961; // Pinto did not exist prior to this block
    let bestBlock = null;

    while (lower <= upper) {
      const mid = lower + Math.floor((upper - lower) / 2);
      bestBlock = await provider.getBlock(mid);

      if (bestBlock.timestamp == timestamp) {
        break;
      }
      if (bestBlock.timestamp < timestamp) {
        lower = mid + 1;
      } else {
        upper = mid - 1;
      }
    }
    return bestBlock;
  }

  // Transforms a block during a pause to the block right before the pause.
  static pauseGuard(block, c = C()) {
    for (const [pauseBlock, unpauseBlock] of c.MILESTONE.pauseBlocks) {
      if (block >= pauseBlock && block < unpauseBlock) {
        return pauseBlock - 1;
      }
    }
    return block;
  }
}

module.exports = BlockUtil;
