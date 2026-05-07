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
    const startBlock = C().MILESTONE.startSeasonBlock ?? 22622961;
    const startTimestamp = C().MILESTONE.startSeasonBlockTimestamp ?? 1732035269;
    const requestedTimestamp = Number(timestamp);
    const estimatedBlockNumber = Math.max(
      startBlock,
      startBlock + Math.floor((requestedTimestamp - startTimestamp) / 2)
    );
    let bestBlock = await provider.getBlock(estimatedBlockNumber);

    if (!bestBlock) {
      return await provider.getBlock('latest');
    }
    if (bestBlock.timestamp === requestedTimestamp || estimatedBlockNumber === startBlock) {
      return bestBlock;
    }

    const direction = bestBlock.timestamp < requestedTimestamp ? 1 : -1;
    let cursorBlockNumber = bestBlock.number;
    for (let i = 1; i <= 3; ++i) {
      cursorBlockNumber += direction;
      if (cursorBlockNumber < startBlock) {
        break;
      }
      const nextBlock = await provider.getBlock(cursorBlockNumber);
      if (!nextBlock) {
        break;
      }

      bestBlock = this._closestBlock(requestedTimestamp, bestBlock, nextBlock);
      if (
        (direction > 0 && nextBlock.timestamp >= requestedTimestamp) ||
        (direction < 0 && nextBlock.timestamp <= requestedTimestamp)
      ) {
        break;
      }
    }
    return bestBlock;
  }

  static _closestBlock(timestamp, a, b) {
    return Math.abs(a.timestamp - timestamp) <= Math.abs(b.timestamp - timestamp) ? a : b;
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
