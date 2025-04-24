const AsyncContext = require('../../../utils/async/context');
const { sequelize } = require('../models');

class SnapshotSowV0Repository {
  // Returns the latest snapshot
  static async latestSnapshot() {
    return await sequelize.models.TractorSnapshotSowV0.findOne({
      order: [['snapshotBlock', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }
}
module.exports = SnapshotSowV0Repository;
