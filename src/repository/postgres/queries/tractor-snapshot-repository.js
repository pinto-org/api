const AsyncContext = require('../../../utils/async/context');
const { Sequelize } = require('../models');

class TractorSnapshotRepository {
  constructor(model) {
    this.model = model;
  }

  // Returns the latest snapshot
  async latestSnapshot() {
    return await this.model.findOne({
      order: [['snapshotBlock', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }

  async findAllWithOptions({ criteriaList, limit, skip } = {}) {
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

    const { rows: snapshots, count } = await this.model.findAndCountAll(options);
    return { snapshots, total: count };
  }
}
module.exports = TractorSnapshotRepository;
