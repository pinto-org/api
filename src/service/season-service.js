const { ethers } = require('ethers');
const FilterLogs = require('../datasources/events/filter-logs');
const SeasonDto = require('../repository/dto/SeasonDto');
const { sequelize } = require('../repository/postgres/models');
const SeasonRepository = require('../repository/postgres/queries/season-repository');
const SharedRepository = require('../repository/postgres/queries/shared-repository');
const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');
const SeasonAssembler = require('../repository/postgres/models/assemblers/season-assembler');

class SeasonService {
  static async getAll() {
    const models = await SharedRepository.genericFind(sequelize.models.Season, {});
    return models.map((m) => SeasonAssembler.fromModel(m));
  }

  // Finds the corresponding onchain event and inserts the season info
  static async insertSeasonFromEvent(season) {
    const events = await FilterLogs.getBeanstalkEvents(['Sunrise'], {
      indexedTopics: [ethers.toBeHex(season, 32)],
      safeBatch: false
    });
    if (events.length === 0) {
      throw new Error(`No sunrise event found for season ${season}`);
    }

    const dto = await SeasonDto.fromEvent(events[0]);
    await SharedRepository.genericUpsert(sequelize.models.Season, [dto], false);
  }

  static async findMissingSeasons() {
    const currentSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;
    const missingSeasons = await SeasonRepository.findMissingSeasons(currentSeason);
    return missingSeasons.filter((s) => s >= 2);
  }
}
module.exports = SeasonService;
