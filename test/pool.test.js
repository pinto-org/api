const Contracts = require('../src/datasources/contracts/contracts');
const WellDto = require('../src/repository/dto/WellDto');
const PriceService = require('../src/service/price-service');
const ConstantProductWellUtil = require('../src/service/utils/pool/constant-product');
const LiquidityUtil = require('../src/service/utils/pool/liquidity');
const WellFnUtil = require('../src/service/utils/pool/well-fn');
const { mockBeanstalkConstants } = require('./util/mock-constants');

describe('Pool Math', () => {
  beforeEach(() => {
    mockBeanstalkConstants();
  });

  test('Pool Liquidity USD', async () => {
    const sampleWell = require('./mock-responses/subgraph/entities/well.json');
    const well = new WellDto(sampleWell);

    jest
      .spyOn(PriceService, 'getTokenPrice')
      .mockResolvedValueOnce({ usdPrice: 0.98 })
      .mockResolvedValueOnce({ usdPrice: 2800 });

    const liquidity = await LiquidityUtil.calcWellLiquidityUSD(well, 20800000);

    expect(liquidity).toBeCloseTo(51184.59741693586);
  });
  test('Liquidity depth', async () => {
    const mockWellDto = {
      reserves: {
        raw: [14263546671971n, 2216675511188549508768n]
      },
      rates: [6434.657034, 0.000155408438179298],
      tokenDecimals: () => [6, 18],
      wellFunction: {
        id: 'abc',
        data: '0x'
      }
    };
    jest.spyOn(Contracts, 'getWellFunction').mockReturnValue({
      calcReserveAtRatioSwap: jest
        .fn()
        .mockResolvedValueOnce(2194835811232559843749n)
        .mockResolvedValueOnce(14123015691385n)
        .mockResolvedValueOnce(2239180408272262904842n)
        .mockResolvedValueOnce(14408357965030n)
    });

    const depth2 = await LiquidityUtil.calcDepth(mockWellDto);

    expect(depth2.buy.float[0]).toBeCloseTo(140530.980586);
    expect(depth2.buy.float[1]).toBeCloseTo(21.839699955989666);
    expect(depth2.sell.float[0]).toBeCloseTo(144811.293059);
    expect(depth2.sell.float[1]).toBeCloseTo(22.504897083713395);
  });
  describe('Liquidity event volume', () => {
    test('Add Liquidity', async () => {
      const prevLp = 38729833462074168851n;
      const newLp = 54772255750516611345n;
      const deltaLp = newLp - prevLp;
      const calcLPTokenUnderlyingMock = jest.fn().mockResolvedValueOnce([878679656n, 292893218813452475n]);
      jest.spyOn(Contracts, 'get').mockReturnValue({
        calcLpTokenSupply: jest.fn().mockResolvedValueOnce(prevLp).mockResolvedValueOnce(newLp),
        calcLPTokenUnderlying: calcLPTokenUnderlyingMock
      });

      const result = await WellFnUtil.calcLiquidityVolume(
        {
          wellFunction: {
            id: 'abc',
            data: '0x'
          }
        },
        [1500n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)],
        [3000n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)]
      );

      expect(calcLPTokenUnderlyingMock).toHaveBeenCalledWith(deltaLp, expect.any(Array), newLp, expect.any(String));
      expect(result[0]).toEqual(-621320344n);
      expect(result[1]).toEqual(292893218813452475n);
    });
    test('Remove Liquidity', async () => {
      const prevLp = 173205080756887729352n;
      const newLp = 116189500386222506555n;
      const deltaLp = prevLp - newLp;
      const calcLPTokenUnderlyingMock = jest.fn().mockResolvedValueOnce([987538820n, 3291796067500630910n]);
      jest.spyOn(Contracts, 'get').mockReturnValue({
        calcLpTokenSupply: jest.fn().mockResolvedValueOnce(prevLp).mockResolvedValueOnce(newLp),
        calcLPTokenUnderlying: calcLPTokenUnderlyingMock
      });

      const result = await WellFnUtil.calcLiquidityVolume(
        {
          wellFunction: {
            id: 'xyz',
            data: '0x'
          }
        },
        [3000n * BigInt(10 ** 6), 10n * BigInt(10 ** 18)],
        [1500n * BigInt(10 ** 6), 9n * BigInt(10 ** 18)]
      );

      expect(calcLPTokenUnderlyingMock).toHaveBeenCalledWith(deltaLp, expect.any(Array), prevLp, expect.any(String));
      expect(result[0]).toEqual(512461180n);
      expect(result[1]).toEqual(-2291796067500630910n);
    });
  });

  describe('Off-chain calculations', () => {
    test('Constant product rate', async () => {
      const prices = ConstantProductWellUtil.calcRate([13834969782037n, 4519904117717436850412n], [6, 18]);

      expect(prices.raw[0]).toEqual(326701408743658n);
      expect(prices.raw[1]).toEqual(3060898953n);
      expect(prices.float[0]).toBeCloseTo(0.000326701408743658);
      expect(prices.float[1]).toBeCloseTo(3060.898953);
    });
  });
});
