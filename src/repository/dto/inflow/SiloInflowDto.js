const { C } = require('../../../constants/runtime-constants');
const { BigInt_abs, BigInt_min } = require('../../../utils/bigint');
const { fromBigInt } = require('../../../utils/number');

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
      // Negation values assigned later with bdv/usd in assignInstValues
      this.accountFieldNegationBdv = 0n;
      this.protocolFieldNegationBdv = 0n;
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
      this.accountFieldNegationBdv = data.accountFieldNegationBdv;
      this.accountFieldNegationUsd = data.accountFieldNegationUsd;
      this.protocolFieldNegationBdv = data.protocolFieldNegationBdv;
      this.protocolFieldNegationUsd = data.protocolFieldNegationUsd;
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

  async assignInstValues(bdv, bdvPrice, netFieldBdvInflows) {
    this.bdv = bdv;
    this.usd = bdvPrice * fromBigInt(this.bdv, 6);

    const accountFlow = netFieldBdvInflows[this.account] ?? 0n;
    if (this.bdv > 0n && accountFlow < 0n) {
      this.accountFieldNegationBdv = -BigInt_min(BigInt_abs(accountFlow), this.bdv);
    } else if (this.bdv < 0n && accountFlow > 0n) {
      this.accountFieldNegationBdv = BigInt_min(accountFlow, BigInt_abs(this.bdv));
    }
    netFieldBdvInflows[this.account] -= this.accountFieldNegationBdv;

    const protocolFlow = netFieldBdvInflows.protocol ?? 0n;
    if (this.bdv > 0n && protocolFlow < 0n) {
      this.protocolFieldNegationBdv = -BigInt_min(BigInt_abs(protocolFlow), this.bdv);
    } else if (this.bdv < 0n && protocolFlow > 0n) {
      this.protocolFieldNegationBdv = BigInt_min(protocolFlow, BigInt_abs(this.bdv));
    }
    netFieldBdvInflows.protocol -= this.protocolFieldNegationBdv;

    this.accountFieldNegationUsd = bdvPrice * fromBigInt(this.accountFieldNegationBdv, 6);
    this.protocolFieldNegationUsd = bdvPrice * fromBigInt(this.protocolFieldNegationBdv, 6);
  }
}

module.exports = SiloInflowDto;
