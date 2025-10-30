const { BigInt_abs, BigInt_min } = require('../../../utils/bigint');
const { fromBigInt } = require('../../../utils/number');

class FieldInflowDto {
  constructor(type, data) {
    if (type === 'data') {
      const { account, beans, beanPrice, isMarket, block, timestamp, txnHash } = data;
      this.account = account;
      this.beans = beans;
      this.usd = beanPrice * fromBigInt(beans, 6);
      this.isMarket = isMarket;
      // Negation values assigned outside
      this.accountSiloNegationBdv = 0n;
      this.protocolSiloNegationBdv = 0n;
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

  static fromData({ account, beans, beanPrice, isMarket, block, timestamp, txnHash }, netSiloBdvInflows) {
    const dto = new FieldInflowDto('data', { account, beans, beanPrice, isMarket, block, timestamp, txnHash });

    const accountFlow = netSiloBdvInflows[account] ?? 0n;
    if (beans > 0n && accountFlow < 0n) {
      dto.accountSiloNegationBdv = -BigInt_min(BigInt_abs(accountFlow), beans);
    } else if (beans < 0n && accountFlow > 0n) {
      dto.accountSiloNegationBdv = BigInt_min(accountFlow, BigInt_abs(beans));
    }
    if (netSiloBdvInflows[account]) {
      netSiloBdvInflows[account] -= dto.accountSiloNegationBdv;
    }

    const protocolFlow = netSiloBdvInflows.protocol ?? 0n;
    if (beans > 0n && protocolFlow < 0n) {
      dto.protocolSiloNegationBdv = -BigInt_min(BigInt_abs(protocolFlow), beans);
    } else if (beans < 0n && protocolFlow > 0n) {
      dto.protocolSiloNegationBdv = BigInt_min(protocolFlow, BigInt_abs(beans));
    }
    if (netSiloBdvInflows.protocol) {
      netSiloBdvInflows.protocol -= dto.protocolSiloNegationBdv;
    }

    dto.accountSiloNegationUsd = beanPrice * fromBigInt(dto.accountSiloNegationBdv, 6);
    dto.protocolSiloNegationUsd = beanPrice * fromBigInt(dto.protocolSiloNegationBdv, 6);

    return dto;
  }

  static fromModel(model) {
    return new FieldInflowDto('db', model);
  }
}

module.exports = FieldInflowDto;
