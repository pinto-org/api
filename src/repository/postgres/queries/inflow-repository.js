const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class InflowRepository {
  // Returns the combined seasonal inflow data for silo and field
  static async getCombinedInflowSnapshots({ criteriaList, limit, skip } = {}) {
    const options = {
      attributes: [
        'season',
        'snapshotBlock',
        'snapshotTimestamp',
        [
          sequelize.literal('"SiloInflowSnapshot"."cumulativeUsdNet" + "FieldInflowSnapshot"."cumulativeUsdNet"'),
          'all_cumulative_usd_net'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."cumulativeUsdIn" + "FieldInflowSnapshot"."cumulativeUsdIn"'),
          'all_cumulative_usd_in'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."cumulativeUsdOut" + "FieldInflowSnapshot"."cumulativeUsdOut"'),
          'all_cumulative_usd_out'
        ],
        ['cumulativeUsdNet', 'silo_cumulative_usd_net'],
        ['cumulativeUsdIn', 'silo_cumulative_usd_in'],
        ['cumulativeUsdOut', 'silo_cumulative_usd_out'],
        [sequelize.literal('"FieldInflowSnapshot"."cumulativeUsdNet"'), 'field_cumulative_usd_net'],
        [sequelize.literal('"FieldInflowSnapshot"."cumulativeUsdIn"'), 'field_cumulative_usd_in'],
        [sequelize.literal('"FieldInflowSnapshot"."cumulativeUsdOut"'), 'field_cumulative_usd_out'],
        [
          sequelize.literal(
            '"SiloInflowSnapshot"."cumulativeUsdIn" + "SiloInflowSnapshot"."cumulativeUsdOut" + ' +
              '"FieldInflowSnapshot"."cumulativeUsdIn" + "FieldInflowSnapshot"."cumulativeUsdOut"'
          ),
          'all_cumulative_usd_volume'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."cumulativeUsdIn" + "SiloInflowSnapshot"."cumulativeUsdOut"'),
          'silo_cumulative_usd_volume'
        ],
        [
          sequelize.literal('"FieldInflowSnapshot"."cumulativeUsdIn" + "FieldInflowSnapshot"."cumulativeUsdOut"'),
          'field_cumulative_usd_volume'
        ],
        // Delta calculations
        [
          sequelize.literal('"SiloInflowSnapshot"."deltaUsdNet" + "FieldInflowSnapshot"."deltaUsdNet"'),
          'all_delta_usd_net'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."deltaUsdIn" + "FieldInflowSnapshot"."deltaUsdIn"'),
          'all_delta_usd_in'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."deltaUsdOut" + "FieldInflowSnapshot"."deltaUsdOut"'),
          'all_delta_usd_out'
        ],
        ['deltaUsdNet', 'silo_delta_usd_net'],
        ['deltaUsdIn', 'silo_delta_usd_in'],
        ['deltaUsdOut', 'silo_delta_usd_out'],
        [sequelize.literal('"FieldInflowSnapshot"."deltaUsdNet"'), 'field_delta_usd_net'],
        [sequelize.literal('"FieldInflowSnapshot"."deltaUsdIn"'), 'field_delta_usd_in'],
        [sequelize.literal('"FieldInflowSnapshot"."deltaUsdOut"'), 'field_delta_usd_out'],
        [
          sequelize.literal(
            '"SiloInflowSnapshot"."deltaUsdIn" + "SiloInflowSnapshot"."deltaUsdOut" + "FieldInflowSnapshot"."deltaUsdIn" + "FieldInflowSnapshot"."deltaUsdOut"'
          ),
          'all_delta_usd_volume'
        ],
        [
          sequelize.literal('"SiloInflowSnapshot"."deltaUsdIn" + "SiloInflowSnapshot"."deltaUsdOut"'),
          'silo_delta_usd_volume'
        ],
        [
          sequelize.literal('"FieldInflowSnapshot"."deltaUsdIn" + "FieldInflowSnapshot"."deltaUsdOut"'),
          'field_delta_usd_volume'
        ]
      ],
      include: [
        {
          model: sequelize.models.FieldInflowSnapshot,
          required: true,
          attributes: [],
          on: sequelize.where(
            sequelize.col('SiloInflowSnapshot.season'),
            '=',
            sequelize.col('FieldInflowSnapshot.season')
          )
        }
      ],
      order: [['season', 'DESC']],
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

    const { rows: results, count } = await sequelize.models.SiloInflowSnapshot.findAndCountAll(options);
    return { snapshots: results.map((row) => row.toJSON()), total: count };
  }
}
module.exports = InflowRepository;
