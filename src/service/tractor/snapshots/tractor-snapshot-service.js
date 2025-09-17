// TODO: much of the snapshotting logic can be made generic by supplying assemblers/repositories etc statically

class TractorSnapshotService {
  /**
   * Returns the block number of when the next snapshot should be taken
   * @abstract
   */
  static async nextSnapshotBlock() {
    throw new Error('nextSnapshotBlock must be implemented by subclass');
  }

  /**
   * Inserts a snapshot of the current state.
   * Data must have already been updated through snapshotBlock (having written to meta is optional).
   * @param {number} snapshotBlock
   * @abstract
   */
  static async takeSnapshot(snapshotBlock) {
    throw new Error('takeSnapshot must be implemented by subclass');
  }

  /**
   * Retrieves tractor snapshots matching the requested criteria
   * @param {import('../../../../types/types').TractorSnapshotsRequest} request
   * @returns {Promise<import('../../../../types/types').TractorSnapshotsResult>}
   * @abstract
   */
  static async getSnapshots(request) {
    throw new Error('getSnapshots must be implemented by subclass');
  }
}

module.exports = TractorSnapshotService;
