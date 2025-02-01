const BeanstalkPrice = require('../../src/datasources/contracts/upgradeable/beanstalk-price');
const SiloApyService = require('../../src/service/silo-apy');
const ExchangeYieldsService = require('../../src/service/utils/exchange/exchange-yields');

describe('Exchange Yields', () => {
  test('Extracts yield info', async () => {
    jest.spyOn(SiloApyService, 'getApy').mockResolvedValue({
      yields: {
        24: '1d window',
        168: '7d window',
        500: 'max window'
      }
    });
    jest.spyOn(BeanstalkPrice, 'make').mockReturnValue({
      price: jest.fn().mockResolvedValue({
        ps: [
          {
            pool: 'a',
            tokens: ['b', 'c'],
            liquidity: '500000000'
          },
          {
            pool: 'x',
            tokens: ['y', 'z'],
            liquidity: '7500000000'
          }
        ]
      })
    });

    const result = await ExchangeYieldsService.getYields();

    expect(result.poolYields).toBe('max window');
    expect(result.poolPriceInfo).toEqual({
      a: {
        nonBeanToken: 'c',
        liquidity: 500
      },
      x: {
        nonBeanToken: 'z',
        liquidity: 7500
      }
    });
  });
});
