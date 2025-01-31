const SiloApyService = require('../../silo-apy');
const BeanstalkPrice = require('../../../datasources/contracts/upgradeable/beanstalk-price');
const { fromBigInt } = require('../../../utils/number');

class ExchangeYieldsService {
  // Returns info on current pools/current yields
  static async getYields() {
    const apy = await SiloApyService.getApy({});
    const maxWindow = Math.max(...Object.keys(apy.yields).map((w) => parseInt(w)));

    const price = await BeanstalkPrice.make().price({ skipTransform: true });
    const poolPriceInfo = price.ps.reduce((acc, next) => {
      acc[next.pool.toLowerCase()] = {
        nonBeanToken: next.tokens[1],
        liquidity: fromBigInt(BigInt(next.liquidity), 6)
      };
      return acc;
    }, {});

    return {
      poolYields: apy.yields[maxWindow],
      poolPriceInfo
    };
  }
}
module.exports = ExchangeYieldsService;
