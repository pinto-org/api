const { Interface } = require('ethers');
const { C } = require('../../constants/runtime-constants');

class Interfaces {
  static get(address, c = C()) {
    const abi = c.ABIS[address];
    if (!abi) {
      throw new Error(`There is no default ABI for contract ${address}.`);
    }
    return this.makeInterface(abi);
  }

  static getBeanstalk(c = C()) {
    return this.get(c.BEANSTALK, c);
  }

  static makeInterface(abi) {
    return new Interface(abi);
  }

  static safeParseTxn(iface, data) {
    try {
      return iface.parseTransaction({ data });
    } catch (e) {
      return null;
    }
  }
}
module.exports = Interfaces;
