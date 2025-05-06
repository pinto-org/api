class SeasonDto {
  constructor(type, data) {
    if (type === 'data') {
      const { season, block } = data;
      this.season = season;
      this.block = block.number;
      this.timestamp = new Date(Number(block.timestamp) * 1000);
    } else if (type === 'db') {
      this.season = data.season;
      this.block = data.block;
      this.timestamp = data.timestamp;
    }
  }

  static fromData(data) {
    return new SeasonDto('data', data);
  }

  static fromModel(model) {
    return new SeasonDto('db', model);
  }
}

module.exports = SeasonDto;
