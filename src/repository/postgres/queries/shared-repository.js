const Concurrent = require('../../../utils/async/concurrent');
const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class SharedRepository {
  // Retrieves all entities matching the criteria
  static async genericFind(model, criteria) {
    return await model.findAll({
      where: criteria,
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }
  // Upserts entities for any model. Uses the active transaction
  static async genericUpsert(model, values, returning) {
    const upserted = [];

    const TAG = Concurrent.tag(`genericUpsert-${model.name}`);
    for (const v of values) {
      await Concurrent.run(TAG, 50, async () => {
        const [row, _isCreated] = await model.upsert(v, {
          validate: true,
          transaction: AsyncContext.getOrUndef('transaction'),
          returning
        });
        if (returning) {
          upserted.push(row);
        }
      });
    }
    await Concurrent.allResolved(TAG);

    if (returning) {
      return upserted;
    }
  }

  // Finds all "season"s that are missing from the given table
  static async findMissingSeasons(tableName, maxSeason) {
    const seasons = await sequelize.query(
      `
        SELECT s AS missingseason
        FROM generate_series(2, :maxSeason) AS s
        LEFT JOIN (SELECT DISTINCT season FROM ${tableName}) t ON s = t.season
        WHERE t.season IS NULL;
      `,
      {
        replacements: { maxSeason },
        type: Sequelize.QueryTypes.SELECT,
        transaction: AsyncContext.getOrUndef('transaction')
      }
    );
    return seasons.map((s) => s.missingseason).sort((a, b) => a - b);
  }
}
module.exports = SharedRepository;
