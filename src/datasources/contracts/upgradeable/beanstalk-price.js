const { C } = require('../../../constants/runtime-constants');
const UpgradeableContract = require('../upgradeable-contract');

const mapping = [
  // {
  //   chain: 'eth',
  //   start: 17978222,
  //   end: 20298142,
  //   address: '0xb01CE0008CaD90104651d6A84b6B11e182a9B62A',
  //   abi: require('../../abi/price/BeanstalkPrice.json')
  // },
  // {
  //   chain: 'eth',
  //   start: 20298142,
  //   end: 20921738, // Reseed pause block on L1
  //   address: '0x4bed6cb142b7d474242d87f4796387deb9e1e1b4',
  //   abi: require('../../abi/price/BeanstalkPrice.json')
  // },
  // {
  //   chain: 'arb',
  //   start: 262211593, // Reseed unpause block on L2
  //   end: 'latest',
  //   address: '0xc218f5a782b0913931dcf502fa2aa959b36ac9e7',
  //   abi: require('../../abi/price/BeanstalkPrice.json')
  // },
  {
    chain: 'base',
    start: 22622969,
    end: 28930862,
    address: '0xD0fd333F7B30c7925DEBD81B7b7a4DFE106c3a5E',
    abi: require('../../abi/price/PintostalkPrice.json')
  },
  {
    chain: 'base',
    start: 28930862,
    end: 'latest',
    address: '0x13D25ABCB6a19948d35654715c729c6501230b49',
    abi: require('../../abi/price/PintostalkPrice.json')
  }
];

class BeanstalkPrice {
  constructor(block, c) {
    this.contract = UpgradeableContract.make(mapping, c, block);
  }

  async price(options = {}) {
    return await this.contract['price()']({ target: 'SuperContract', ...options });
  }

  async priceReservesCurrent(options = {}) {
    return await this.contract['price(uint8)']({ target: 'SuperContract', ...options }, 0);
  }

  async poolPrice(poolAddress) {
    return await this.contract['poolPrice(address)'](poolAddress);
  }

  static make({ block = 'latest', c = C() } = {}) {
    return new BeanstalkPrice(block, c);
  }
}

module.exports = BeanstalkPrice;
