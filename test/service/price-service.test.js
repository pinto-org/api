const BlockUtil = require('../../src/utils/block');

const { getBeanPrice, getUsdOracleTokenPrice } = require('../../src/service/price-service');
const UpgradeableContract = require('../../src/datasources/contracts/upgradeable-contract');
const { mockBeanstalkConstants } = require('../util/mock-constants');

const defaultOptions = { blockNumber: 19000000 };

describe('PriceService', () => {
  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockFromOptions').mockResolvedValue(mockBlock);
    mockBeanstalkConstants();
  });

  it('should fetch and format Bean price data correctly', async () => {
    const mockPrice = {
      'price()': jest.fn().mockResolvedValue({
        price: 997747n,
        liquidity: 27676822893057n,
        deltaB: -16781104856n
      })
    };
    jest.spyOn(UpgradeableContract, 'make').mockReturnValue(mockPrice);

    const price = await getBeanPrice(defaultOptions);
    expect(price.usdPrice).toEqual(0.9977);
    expect(price.liquidityUSD).toEqual(27676822.89);
    expect(price.deltaB).toEqual(-16781);
  });

  it('should fetch and format USDOracle price correctly', async () => {
    mockUsdOracle = {
      getUsdPrice: jest.fn().mockResolvedValue(390100082091451n),
      getTokenUsdPrice: jest.fn().mockResolvedValue(3403121673n),
      __version: jest.fn().mockReturnValue(1)
    };
    jest.spyOn(UpgradeableContract, 'make').mockReturnValue(mockUsdOracle);

    const price = await getUsdOracleTokenPrice(defaultOptions);
    expect(price.usdPrice).toBeCloseTo(2563.44);

    mockUsdOracle.__version.mockReturnValue(2);
    const price2 = await getUsdOracleTokenPrice({ blockNumber: 20334285 });
    expect(price2.usdPrice).toBeCloseTo(3403.12);
  });
});
