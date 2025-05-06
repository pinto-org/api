const SeasonDto = require('../../../dto/SeasonDto');

class SeasonAssembler {
  static toModel(seasonDto) {
    return {
      season: seasonDto.season,
      block: seasonDto.block,
      timestamp: seasonDto.timestamp
    };
  }

  static fromModel(seasonModel) {
    return SeasonDto.fromModel(seasonModel);
  }
}
module.exports = SeasonAssembler;
