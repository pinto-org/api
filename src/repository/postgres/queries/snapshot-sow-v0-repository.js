const { sequelize } = require('../models');

class SnapshotSowV0Repository {
  // Returns the latest snapshot
  static async latestSnapshot() {
    return await sequelize.models.SnapshotSowV0.findOne({
      order: [['snapshotBlock', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }

  // Determines the current state and inserts a snapshot
  static async takeSnapshot() {
    //
  }
}
module.exports = SnapshotSowV0Repository;
