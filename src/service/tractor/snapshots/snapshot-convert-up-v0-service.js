const TractorSnapshotService = require('./tractor-snapshot-service');

class SnapshotConvertUpV0Service extends TractorSnapshotService {
  // static snapshotRepository = new TractorSnapshotRepository(sequelize.models.TractorSnapshotConvertUpV0);
  // static snapshotAssembler = SnapshotConvertUpV0Assembler;
  static initialSnapshotBlock = 999999999999; // TODO once it occurs onchain

  static async takeSnapshot(snapshotBlock) {
    //
  }
}

module.exports = SnapshotConvertUpV0Service;
