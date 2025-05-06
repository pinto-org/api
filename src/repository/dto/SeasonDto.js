const { C } = require('../../constants/runtime-constants');

class SeasonDto {
  constructor(type, data) {
    if (type === 'evt') {
      const { event, block } = data;
      this.season = Number(event.args.season);
      this.block = block.number;
      this.timestamp = new Date(Number(block.timestamp) * 1000);
      this.sunriseTxn = event.rawLog.transactionHash;
    } else if (type === 'db') {
      this.season = data.season;
      this.block = data.block;
      this.timestamp = data.timestamp;
      this.sunriseTxn = data.sunriseTxn;
    }
  }

  static async fromEvent(event) {
    const block = await C().RPC.getBlock(event.rawLog.blockNumber);
    return new SeasonDto('evt', { event, block });
  }

  static fromModel(model) {
    return new SeasonDto('db', model);
  }
}

module.exports = SeasonDto;
