const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');
const { ApyInitType } = require('../models/types/types');
const SharedRepository = require('./shared-repository');

const DEFAULT_OPTIONS = {
  emaWindows: [24, 168, 720],
  initType: ApyInitType.AVERAGE
};

class YieldRepository {
  // Returns the yields for the requested season
  static async findSeasonYields(season, options) {
    options = { ...DEFAULT_OPTIONS, ...options };

    const optionalWhere = {};
    if (options.where.emaWindows) {
      optionalWhere.emaWindow = {
        [Sequelize.Op.in]: options.where.emaWindows
      };
    }
    if (options.where.initType) {
      optionalWhere.initType = options.where.initType;
    }

    const models = await sequelize.models.Yield.findAll({
      include: [
        {
          model: sequelize.models.Token,
          attributes: ['address']
        }
      ],
      where: {
        season,
        ...optionalWhere
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return models;
  }

  // Returns yields within the requested season range
  static async findHistoricalYields({ token, emaWindow, initType, fromSeason, toSeason, interval }) {
    interval ??= 1;
    const models = await sequelize.models.Yield.findAll({
      include: [
        {
          model: sequelize.models.Token,
          attributes: ['address']
        }
      ],
      where: {
        '$Token.address$': token,
        emaWindow,
        initType,
        [Sequelize.Op.and]: [
          { season: { [Sequelize.Op.between]: [fromSeason, toSeason] } },
          {
            [Sequelize.Op.or]: [
              Sequelize.literal(`"season" % ${interval} = 0`),
              { season: fromSeason },
              { season: toSeason }
            ]
          }
        ]
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return models;
  }

  // Inserts the given yield entries
  static async addYields(yields) {
    const newYields = await sequelize.models.Yield.bulkCreate(yields, {
      validate: true,
      returning: true,
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return newYields;
  }

  // Returns a list of all seasons that are missing yield entries
  static async findMissingSeasons(maxSeason) {
    return await SharedRepository.findMissingSeasons('yield', maxSeason);
  }
}

module.exports = YieldRepository;
