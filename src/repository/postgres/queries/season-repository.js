const { SEASON_TABLE } = require('../../../constants/tables');
const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');
const SharedRepository = require('./shared-repository');

class SeasonRepository {
  // Find/Upsert can use generics in SharedRepository

  // Returns the max processed season for a given block
  static async findMaxSeasonForBlock(block) {
    const maxSeason = await sequelize.models.Season.findOne({
      where: {
        block: {
          [Sequelize.Op.lte]: block
        }
      },
      order: [['season', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return maxSeason;
  }

  static async findMaxSeason() {
    return await sequelize.models.Season.findOne({
      order: [['season', 'DESC']],
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }

  static async getMaxSeasonBlock() {
    return (await this.findMaxSeason())?.block;
  }

  // Returns a list of all seasons that are missing
  static async findMissingSeasons(maxSeason) {
    return await SharedRepository.findMissingSeasons(SEASON_TABLE.env, maxSeason);
  }
}
module.exports = SeasonRepository;
