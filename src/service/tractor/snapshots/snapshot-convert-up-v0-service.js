const TractorSnapshotService = require('./tractor-snapshot-service');

class SnapshotConvertUpV0Service extends TractorSnapshotService {
  // Returns the block number of when the next snapshot should be taken
  static async nextSnapshotBlock() {
    const latestSnapshot = await SnapshotConvertUpV0Repository.latestSnapshot();
    if (latestSnapshot) {
      const dto = SnapshotConvertUpV0Assembler.fromModel(latestSnapshot);
      return dto.snapshotBlock + ChainUtil.blocksPerInterval(C().CHAIN, 1000 * 60 * 60);
    }

    // Initial snapshot is according to the block of the first convert up v0 order. Hardcoded value is acceptable.
    return 999999999999; // TODO once it occurs onchain
  }

  // Inserts a snapshot of the current state.
  // Data must have already been updated through snapshotBlock (having written to meta is optional).
  static async takeSnapshot(snapshotBlock) {
    //
  }

  /**
   * @param {import('../../../../types/types').TractorSnapshotsRequest} request
   * @returns {Promise<import('../../../../types/types').TractorSnapshotsResult>}
   */
  static async getSnapshots(request) {
    //
  }
}

module.exports = SnapshotConvertUpV0Service;
