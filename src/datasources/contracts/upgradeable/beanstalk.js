const { C } = require('../../../constants/runtime-constants');
const Interfaces = require('../interfaces');
const UpgradeableContract = require('../upgradeable-contract');

const mapping = [
  {
    chain: 'base',
    start: 22622969,
    end: 29064231,
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-Launch.json')
  },
  {
    chain: 'base',
    start: 29064231,
    end: 99999999999, // TODO: PI-12 block TBD
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-PI8.json')
  },
  {
    chain: 'base',
    start: 99999999999, // TODO: PI-12 block TBD
    end: 'latest',
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-PI12.json')
  }
];

class Beanstalk {
  constructor(block, c) {
    this.contract = UpgradeableContract.make(mapping, c, block);
  }

  static make({ block = 'latest', c = C() } = {}) {
    return new Beanstalk(block, c);
  }

  static getAllInterfaces(c = C()) {
    const ifaces = [];
    for (const entry of mapping) {
      if (entry.chain === c.CHAIN) {
        ifaces.push(Interfaces.makeInterface(entry.abi));
      }
    }
    return ifaces;
  }
}

module.exports = Beanstalk;
