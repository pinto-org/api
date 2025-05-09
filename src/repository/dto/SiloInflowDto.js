const { C } = require('../../constants/runtime-constants');
const { fromBigInt } = require('../../utils/number');

class SiloInflowDto {
  constructor(type, data) {
    if (type === 'data') {
      const { account, token, amount, isTransfer, isPlenty, block, timestamp, txnHash } = data;
      this.account = account;
      this.token = token;
      this.amount = amount;
      // bdv/usd assigned later for performance reasons
      this.isLp = token !== C().BEAN;
      this.isTransfer = isTransfer;
      this.isPlenty = isPlenty;
      this.block = block;
      this.timestamp = timestamp;
      this.txnHash = txnHash;
    } else if (type === 'db') {
      this.id = data.id;
      this.account = data.account;
      this.token = data.token;
      this.amount = data.amount;
      this.bdv = data.bdv;
      this.usd = data.usd;
      this.isLp = data.isLp;
      this.isTransfer = data.isTransfer;
      this.isPlenty = data.isPlenty;
      this.block = data.block;
      this.timestamp = data.timestamp;
      this.txnHash = data.txnHash;
    }
  }

  static fromData({ account, token, amount, isTransfer, isPlenty, block, timestamp, txnHash }) {
    return new SiloInflowDto('data', { account, token, amount, isTransfer, isPlenty, block, timestamp, txnHash });
  }

  static fromModel(model) {
    return new SiloInflowDto('db', model);
  }

  async assignInstValues(bdv, bdvPrice) {
    this.bdv = bdv;
    this.usd = bdvPrice * fromBigInt(this.bdv, 6);
  }
}

module.exports = SiloInflowDto;
