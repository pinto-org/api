const SnapshotSowV0Assembler = require('../../repository/postgres/models/assemblers/tractor/snapshot-sow-v0-assembler');
const SnapshotSowV0Repository = require('../../repository/postgres/queries/snapshot-sow-v0-repository');
const ChainUtil = require('../../utils/chain');

class SnapshotSowV0Service {
  // Returns the block number of when the next snapshot should be taken
  static async nextSnapshotBlock() {
    const latestSnapshot = await SnapshotSowV0Repository.latestSnapshot();
    if (latestSnapshot) {
      const dto = SnapshotSowV0Assembler.fromModel(latestSnapshot);
      return dto.snapshotBlock + ChainUtil.blocksPerInterval(C().CHAIN, 1000 * 60 * 60);
    }

    // Initial snapshot is according to the block of the first sow v0 order. Hardcoded value is acceptable.
    return 29115727;
  }

  // Inserts a snapshot of the current state
  static async takeSnapshot() {
    //
  }
}

module.exports = SnapshotSowV0Service;
