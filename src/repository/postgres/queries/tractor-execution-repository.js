const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class TractorExecutionRepository {
  static async findAllWithOptions({ joinOrder, criteriaList, limit, skip } = {}) {
    const options = {
      where: {},
      transaction: AsyncContext.getOrUndef('transaction')
    };

    if (joinOrder) {
      options.include = [
        {
          model: sequelize.models.TractorOrder,
          required: false
        }
      ];
    }

    if (criteriaList && criteriaList.length > 0) {
      options.where = {
        [Sequelize.Op.and]: criteriaList
      };
    }

    options.limit = limit;
    if (skip) {
      options.offset = skip;
    }

    const { rows: executions, count } = await sequelize.models.TractorExecution.findAndCountAll(options);
    return { executions, total: count };
  }

  static async getOrdersStats(blueprintHashes) {
    const stats = await sequelize.models.TractorExecution.findAll({
      attributes: [
        'blueprintHash',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'executionCount'],
        [Sequelize.fn('MAX', Sequelize.col('executedTimestamp')), 'latestExecution']
      ],
      where: {
        blueprintHash: {
          [Sequelize.Op.in]: blueprintHashes
        }
      },
      group: ['blueprintHash'],
      raw: true
    });
    const retval = Object.fromEntries(
      stats.map((s) => [
        s.blueprintHash,
        { executionCount: parseInt(s.executionCount), latestExecution: s.latestExecution }
      ])
    );
    for (const hash of blueprintHashes) {
      if (!retval[hash]) {
        retval[hash] = { executionCount: 0, latestExecution: null };
      }
    }
    return retval;
  }
}

module.exports = TractorExecutionRepository;
