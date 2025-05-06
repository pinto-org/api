const { sequelize, Sequelize } = require('../models');

class SeasonRepository {
  // Find/Upsert can use generics in SharedRepository

  // Returns a list of all seasons that are missing
  static async findMissingSeasons(maxSeason) {
    const seasons = await sequelize.query(
      `
      SELECT s AS missingseason
      FROM generate_series(1, :maxSeason) AS s
      LEFT JOIN (SELECT DISTINCT season FROM season) e ON s = e.season
      WHERE e.season IS NULL;
    `,
      {
        replacements: { maxSeason },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return seasons.map((s) => s.missingseason);
  }
}
module.exports = SeasonRepository;
