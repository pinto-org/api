const {
  ADDRESSES: { BEAN, BEAN3CRV, BEANWETH, BEANWSTETH, UNRIPE_BEAN, UNRIPE_LP },
  DECIMALS
} = require('../../src/constants/raw/beanstalk-eth');
const { ApyInitType } = require('../../src/repository/postgres/models/types/types');
const SiloApyService = require('../../src/service/silo-apy');
const GaugeApyUtil = require('../../src/service/utils/apy/gauge');
const PreGaugeApyUtil = require('../../src/service/utils/apy/pre-gauge');
const { toBigInt } = require('../../src/utils/number');
const { mockBeanstalkConstants } = require('../util/mock-constants');
const { mockBeanstalkSG } = require('../util/mock-sg');

describe('Window EMA', () => {
  beforeEach(() => {
    mockBeanstalkConstants();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate window EMA', async () => {
    const rewardMintResponse = require('../mock-responses/subgraph/silo-apy/siloHourlyRewardMints_1.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValue(rewardMintResponse);

    const emaResult = await SiloApyService.calcWindowEMA(21816, [24, 168, 720]);

    expect(emaResult[0]).toEqual({
      effectiveWindow: 24,
      beansPerSeason: 35095777357n
    });
    expect(emaResult[1]).toEqual({
      effectiveWindow: 168,
      beansPerSeason: 11144518350n
    });
    expect(emaResult[2]).toEqual({
      effectiveWindow: 720,
      beansPerSeason: 3250542305n
    });
  });

  it('should fail on invalid seasons or windows', async () => {
    await expect(SiloApyService.calcWindowEMA(6000, [24])).rejects.toThrow();
    await expect(SiloApyService.calcWindowEMA(21816, [0])).rejects.toThrow();
  });

  it('should use up to as many season as are available', async () => {
    const rewardMintResponse = require('../mock-responses/subgraph/silo-apy/siloHourlyRewardMints_2.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValue(rewardMintResponse);

    const emaResult = await SiloApyService.calcWindowEMA(6100, [10000, 20000]);

    expect(emaResult[0].beansPerSeason).not.toBeNaN();
    expect(emaResult[0].beansPerSeason).toEqual(emaResult[1].beansPerSeason);
  });
});

describe('Pre-Gauge Silo APY', () => {
  beforeEach(() => {
    mockBeanstalkConstants();
  });
  it('should calculate basic apy', () => {
    const apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN', 'BEAN:WETH'],
      [3000000n, 4500000n],
      3000000n,
      44103977396567n,
      1636664801904743831n,
      24942000280720n,
      {
        initType: ApyInitType.AVERAGE
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.318007383109455);
    expect(apy['BEAN'].stalk).toBeCloseTo(0.8994181156045856);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.4703966838366106);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.35754513429389356);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(1.2738188145791554);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(0.7602315241361547);
  });

  it('should calculate with optional inputs', () => {
    let apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN', 'BEAN:WETH'],
      [3000000n, 4500000n],
      3000000n,
      44103977396567n,
      1636664801904743831n,
      24942000280720n,
      // User starts with a deposit
      {
        initType: ApyInitType.AVERAGE,
        initUserValues: [
          {
            stalkPerBdv: 2.5
          },
          {
            stalkPerBdv: 3.25
          }
        ]
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.24004075111638348);
    expect(apy['BEAN'].stalk).toBeCloseTo(1.2621145577496613);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.7511709069463572);

    expect(apy['BEAN:WETH'].bean).toBeCloseTo(0.327868076925108);
    expect(apy['BEAN:WETH'].stalk).toBeCloseTo(1.4331142254568838);
    expect(apy['BEAN:WETH'].ownership).toBeCloseTo(0.883546892132657);

    apy = PreGaugeApyUtil.calcApy(
      1278000000n,
      ['BEAN'],
      [3000000n],
      3000000n,
      44103977396567n,
      1636664801904743831n,
      24942000280720n,
      {
        initType: ApyInitType.NEW,
        duration: 720 // 1 month
      }
    );

    expect(apy['BEAN'].bean).toBeCloseTo(0.006192371151397369);
    expect(apy['BEAN'].stalk).toBeCloseTo(0.22283975910921727);
    expect(apy['BEAN'].ownership).toBeCloseTo(0.20216140896555207);
  });
});

describe('Gauge Silo APY', () => {
  beforeEach(() => {
    mockBeanstalkConstants();
  });
  it('should calculate with required inputs', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, DECIMALS.bdv),
      [BEAN, BEANWETH, UNRIPE_BEAN, UNRIPE_LP],
      [-1, 0, -2, -2],
      [toBigInt(100, DECIMALS.gaugePoints)],
      [toBigInt(899088, DECIMALS.bdv)],
      toBigInt(44139839, DECIMALS.bdv),
      [toBigInt(100, DECIMALS.optimalPercentDepositedBdv)],
      toBigInt(0.33, DECIMALS.beanToMaxLpGpPerBdvRatio),
      toBigInt(2798474, DECIMALS.bdv),
      toBigInt(161540879, DECIMALS.stalk),
      0,
      [0n, 0n],
      [[0n, 0n]],
      [0n, 0n],
      [null, null, 0n, toBigInt(4, DECIMALS.seeds)],
      {
        initType: ApyInitType.AVERAGE
      }
    );

    expect(apy[BEAN].bean).toBeCloseTo(0.35084711071357977);
    expect(apy[BEAN].stalk).toBeCloseTo(1.6586973099708102);
    expect(apy[BEAN].ownership).toBeCloseTo(0.9537401121405971);

    expect(apy[BEANWETH].bean).toBeCloseTo(0.4798080252579915);
    expect(apy[BEANWETH].stalk).toBeCloseTo(3.093009778951926);
    expect(apy[BEANWETH].ownership).toBeCloseTo(2.007742684559264);

    expect(apy[UNRIPE_BEAN].bean).toBeCloseTo(0.221615077591919);
    expect(apy[UNRIPE_BEAN].stalk).toBeCloseTo(0.22288696036564187);
    expect(apy[UNRIPE_BEAN].ownership).toBeCloseTo(-0.10136317582302204);

    expect(apy[UNRIPE_LP].bean).toBeCloseTo(0.3272446909167759);
    expect(apy[UNRIPE_LP].stalk).toBeCloseTo(1.3440728289283832);
    expect(apy[UNRIPE_LP].ownership).toBeCloseTo(0.7225387389836214);
  });

  it('should calculate with optional inputs', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, DECIMALS.bdv),
      [BEAN, BEANWETH],
      [-1, 0],
      [toBigInt(100, DECIMALS.gaugePoints)],
      [toBigInt(899088, DECIMALS.bdv)],
      toBigInt(44139839, DECIMALS.bdv),
      [toBigInt(100, DECIMALS.optimalPercentDepositedBdv)],
      toBigInt(0.33, DECIMALS.beanToMaxLpGpPerBdvRatio),
      toBigInt(2798474, DECIMALS.bdv),
      toBigInt(161540879, DECIMALS.stalk),
      0,
      [0n, toBigInt(1500000, DECIMALS.bdv)],
      [[toBigInt(500000, DECIMALS.bdv), 0n]],
      [toBigInt(1000000, DECIMALS.bdv), toBigInt(500000, DECIMALS.bdv)],
      [null, null],
      {
        initType: ApyInitType.AVERAGE,
        // User starts with a specific deposit
        initUserValues: [
          {
            // Scenario: 40 stalk on a 15 bean deposit, with 30 beans germinating
            stalkPerBdv: 40 / (15 + 30),
            germinating: [30 / (15 + 30), 0]
          },
          {
            stalkPerBdv: 3.25
          }
        ],
        // 6 months only
        duration: 720 * 6
      }
    );

    expect(apy[BEAN].bean).toBeCloseTo(0.08433852683524257);
    expect(apy[BEAN].stalk).toBeCloseTo(1.4782724618253313);
    expect(apy[BEAN].ownership).toBeCloseTo(1.187649975142062);

    expect(apy[BEANWETH].bean).toBeCloseTo(0.17316920083743503);
    expect(apy[BEANWETH].stalk).toBeCloseTo(1.4166310347649171);
    expect(apy[BEANWETH].ownership).toBeCloseTo(1.1332371256859874);

    const apyNew = GaugeApyUtil.calcApy(
      toBigInt(1278, DECIMALS.bdv),
      [BEAN, BEANWETH],
      [-1, 0],
      [toBigInt(100, DECIMALS.gaugePoints)],
      [toBigInt(899088, DECIMALS.bdv)],
      toBigInt(44139839, DECIMALS.bdv),
      [toBigInt(100, DECIMALS.optimalPercentDepositedBdv)],
      toBigInt(0.33, DECIMALS.beanToMaxLpGpPerBdvRatio),
      toBigInt(2798474, DECIMALS.bdv),
      toBigInt(161540879, DECIMALS.stalk),
      0,
      [0n, 0n],
      [[0n, 0n]],
      [0n, 0n],
      [null, null],
      {
        initType: ApyInitType.NEW
      }
    );

    expect(apyNew[BEAN].bean).toBeCloseTo(0.19484986572790186);
    expect(apyNew[BEAN].stalk).toBeCloseTo(5.071389671075412);
    expect(apyNew[BEAN].ownership).toBeCloseTo(3.461552464934931);

    expect(apyNew[BEANWETH].bean).toBeCloseTo(0.3238107802723085);
    expect(apyNew[BEANWETH].stalk).toBeCloseTo(9.914882255462954);
    expect(apyNew[BEANWETH].ownership).toBeCloseTo(7.020786421160418);
  });

  it('should calculate with multiple gauge lp', () => {
    const apy = GaugeApyUtil.calcApy(
      toBigInt(1278, DECIMALS.bdv),
      [BEAN, BEANWETH, BEANWSTETH, UNRIPE_LP],
      [-1, 0, 1, -2],
      [toBigInt(100, DECIMALS.gaugePoints), toBigInt(400, DECIMALS.gaugePoints)],
      [toBigInt(152986, DECIMALS.bdv), toBigInt(2917, DECIMALS.bdv)],
      toBigInt(45236258, DECIMALS.bdv),
      [toBigInt(20, DECIMALS.optimalPercentDepositedBdv), toBigInt(80, DECIMALS.optimalPercentDepositedBdv)],
      toBigInt(1, DECIMALS.beanToMaxLpGpPerBdvRatio),
      toBigInt(5588356, DECIMALS.bdv),
      toBigInt(172360290, DECIMALS.stalk),
      0,
      [0n, 0n],
      [
        [0n, 25000n],
        [5000n, 0n]
      ],
      [0n, 0n],
      [null, null, null, 0n],
      { initType: ApyInitType.AVERAGE }
    );

    expect(apy[BEANWETH].bean).toBeCloseTo(0.204566395461806);
    expect(apy[BEANWETH].stalk).toBeCloseTo(0.22876485266753824);
    expect(apy[BEANWETH].ownership).toBeCloseTo(-0.1306736178082944);
    expect(apy[BEANWSTETH].bean).toBeCloseTo(0.4834466031616589);
    expect(apy[BEANWSTETH].stalk).toBeCloseTo(3.577499710034183);
    expect(apy[BEANWSTETH].ownership).toBeCloseTo(2.2384888400484484);
  });
});

describe('SiloApyService Orchestration', () => {
  beforeEach(() => {
    mockBeanstalkConstants();
    jest
      .spyOn(SiloApyService, 'calcWindowEMA')
      .mockResolvedValue([{ effectiveWindow: 720, beansPerSeason: 322227371n }]);
  });

  it('pre-gauge should supply appropriate parameters', async () => {
    const seasonBlockResponse = require('../mock-responses/subgraph/silo-apy/preGaugeApyInputs_1.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(seasonBlockResponse);
    const preGaugeApyInputsResponse = require('../mock-responses/subgraph/silo-apy/preGaugeApyInputs_2.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(preGaugeApyInputsResponse);

    const spy = jest.spyOn(PreGaugeApyUtil, 'calcApy');
    spy.mockReturnValueOnce({
      [BEAN]: {
        bean: 0.1,
        stalk: 5,
        ownership: 1.5
      },
      [BEAN3CRV]: {
        bean: 0.12,
        stalk: 5.5,
        ownership: 1.7
      }
    });

    const result = await SiloApyService.calcApy(19000, [720], [BEAN, BEAN3CRV], { initType: ApyInitType.AVERAGE });

    expect(spy).toHaveBeenCalledWith(
      322227371n,
      ['0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab', '0xc9c32cd16bf7efb85ff14e0c8603cc90f6f2ee49'],
      [3000000n, 3250000n],
      3000000n,
      44103977396567n,
      1448607918287565335n,
      29993650158762n,
      { initType: ApyInitType.AVERAGE }
    );

    expect(result.season).toEqual(19000);
    expect(result.yields[720][BEAN].bean).toEqual(0.1);
    expect(result.yields[720][BEAN3CRV].stalk).toEqual(5.5);
  });

  it('gauge should supply appropriate parameters', async () => {
    const seasonBlockResponse = require('../mock-responses/subgraph/silo-apy/gaugeApyInputs_1.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(seasonBlockResponse);
    const gaugeApyInputsResponse = require('../mock-responses/subgraph/silo-apy/gaugeApyInputs_2.json');
    jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(gaugeApyInputsResponse);

    const spy = jest.spyOn(GaugeApyUtil, 'calcApy');
    spy.mockReturnValueOnce({
      [BEAN]: {
        bean: 0.1,
        stalk: 5,
        ownership: 1.5
      },
      [BEAN3CRV]: {
        bean: 0.12,
        stalk: 5.5,
        ownership: 1.7
      },
      [BEANWETH]: {
        bean: 0.19,
        stalk: 8.5,
        ownership: 3.7
      },
      [UNRIPE_BEAN]: {
        bean: 0.02,
        stalk: 1.5,
        ownership: 0.7
      }
    });

    const result = await SiloApyService.calcApy(22096, [720], [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN], {
      initType: ApyInitType.AVERAGE
    });
    // console.log('outer apy result', result);

    expect(spy).toHaveBeenCalledWith(
      322227371n,
      [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN],
      [-1, -2, 0, -2],
      [100000000000000000000n],
      [1876895701119n],
      44983287794775n,
      [100000000n],
      100000000000000000000n,
      4496580226358n,
      1718032876867569323n,
      22096,
      [0n, 2059972416n],
      [[0n, 0n]],
      [0n, 0n],
      [null, 1n, null, 1n],
      { initType: ApyInitType.AVERAGE }
    );

    expect(result.season).toEqual(22096);
    expect(result.yields[720][BEAN].bean).toEqual(0.1);
    expect(result.yields[720][BEAN3CRV].stalk).toEqual(5.5);
  });
});
