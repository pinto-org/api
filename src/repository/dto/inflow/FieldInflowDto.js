class FieldInflowDto {
  constructor(type, data) {
    if (type === 'data') {
      const { account, beans, usd, isMarket, block, timestamp, txnHash } = data;
      this.account = account;
      this.beans = beans;
      this.usd = usd;
      this.isMarket = isMarket;
      /// TODO
      this.accountSiloNegationBdv = 0n;
      this.accountSiloNegationUsd = 0;
      this.protocolSiloNegationBdv = 0n;
      this.protocolSiloNegationUsd = 0;
      ///
      this.block = block;
      this.timestamp = timestamp;
      this.txnHash = txnHash;
    } else if (type === 'db') {
      this.id = data.id;
      this.account = data.account;
      this.beans = data.beans;
      this.usd = data.usd;
      this.isMarket = data.isMarket;
      this.accountSiloNegationBdv = data.accountSiloNegationBdv;
      this.accountSiloNegationUsd = data.accountSiloNegationUsd;
      this.protocolSiloNegationBdv = data.protocolSiloNegationBdv;
      this.protocolSiloNegationUsd = data.protocolSiloNegationUsd;
      this.block = data.block;
      this.timestamp = data.timestamp;
      this.txnHash = data.txnHash;
    }
  }

  static fromData({ account, beans, usd, isMarket, block, timestamp, txnHash }) {
    return new FieldInflowDto('data', { account, beans, usd, isMarket, block, timestamp, txnHash });
  }

  static fromModel(model) {
    return new FieldInflowDto('db', model);
  }
}

module.exports = FieldInflowDto;
