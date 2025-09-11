const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../contracts');
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
    end: 99999999999, // TODO: PI-13 block TBD
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-PI8.json')
  },
  {
    chain: 'base',
    start: 99999999999, // TODO: PI-13 block TBD
    end: 'latest',
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-PI13.json')
  }
];

class Beanstalk {
  constructor(block, c) {
    this.contract = UpgradeableContract.make(mapping, c, block);
  }

  static make({ block = 'latest', c = C() } = {}) {
    return new Beanstalk(block, c);
  }

  // Returns all interfaces (for all abi versions) of this contract. Pulls the Alchemy Contract interface
  // rather than ethersjs interface for backwards compatibility with BigNumber/BigInt typing in parsed events.
  static getAllInterfaces(c = C()) {
    const ifaces = [];
    for (const entry of mapping) {
      if (entry.chain === c.CHAIN) {
        const contract = Contracts.makeContract(entry.address, entry.abi, c.RPC);
        ifaces.push(contract.interface);
      }
    }
    return ifaces;
  }
}

module.exports = Beanstalk;
