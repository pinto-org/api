const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class SnapshotSowV0Repository {
  // Returns the latest snapshot
  static async latestSnapshot() {
    return await sequelize.models.TractorSnapshotSowV0.findOne({
      order: [['snapshotBlock', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }

  static async findAllWithOptions({ criteriaList, limit, skip } = {}) {
    const options = {
      where: {},
      order: [['snapshotBlock', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    };

    if (criteriaList && criteriaList.length > 0) {
      options.where = {
        [Sequelize.Op.and]: criteriaList
      };
    }

    options.limit = limit;
    if (skip) {
      options.offset = skip;
    }

    const { rows: snapshots, count } = await sequelize.models.TractorSnapshotSowV0.findAndCountAll(options);
    return { snapshots, total: count };
  }
}
module.exports = SnapshotSowV0Repository;
