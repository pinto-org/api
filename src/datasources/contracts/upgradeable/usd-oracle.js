const { C } = require('../../../constants/runtime-constants');
const UpgradeableContract = require('../upgradeable-contract');

const mapping = [
  // {
  //   chain: 'eth',
  //   start: 18466741,
  //   end: 20334284,
  //   address: '0x1aa19ed7dfc555e4644c9353ad383c33024855f7',
  //   abi: require('../../abi/price/UsdOracle1.json')
  //   version: 1
  // },
  // {
  //   chain: 'eth',
  //   start: 20334284,
  //   end: 20921738, // Reseed pause block on L1
  //   address: '0xb24a70b71e4cca41eb114c2f61346982aa774180',
  //   abi: require('../../abi/price/UsdOracle2.json')
  //   version: 2
  // },
  // {
  //   chain: 'arb',
  //   start: 262211593, // Reseed unpause block on L2
  //   end: 'latest',
  //   address: '0xD1A0060ba708BC4BCD3DA6C37EFa8deDF015FB70',
  //   abi: require('../../abi/beanstalk/Beanstalk-BIP50.json'),
  //   version: 3
  // },
  {
    chain: 'base',
    start: 22622969,
    end: 'latest',
    address: '0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f',
    abi: require('../../abi/beanstalk/Pinto-Launch.json'),
    version: 3
  }
];

class UsdOracle {
  constructor({ block = 'latest', c = C() } = {}) {
    this.contract = UpgradeableContract.make(mapping, c, block);
  }

  async getTokenUsdPrice(token) {
    // Logic for versions 2 and 3 is the same, but version 3 is the beanstalk contract.
    const result =
      this.contract.__version() === 1
        ? await this.contract.getUsdPrice(token)
        : await this.contract.getTokenUsdPrice(token);
    // Version 1 returned a twa price, but with no lookback. Its already instantaneous but needs conversion
    const instPrice = this.contract.__version() === 1 ? BigInt(10 ** 24) / result : result;
    return instPrice;
  }

  async getUsdTokenPrice(token) {
    return await this.contract.getUsdTokenPrice(token);
  }

  async getMillionUsdPrice(token, lookback = 0) {
    return await this.contract.getMillionUsdPrice(token, lookback);
  }

  async getTokenUsdTwap(token, lookback = 3600) {
    return await this.contract.getTokenUsdTwap(token, lookback);
  }
}

module.exports = UsdOracle;
