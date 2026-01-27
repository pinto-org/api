const { getMigratedGrownStalk, getUnmigratedGrownStalk } = require('../../src/service/silo-service');
const BlockUtil = require('../../src/utils/block');
const {
  ADDRESSES: { BEAN, UNRIPE_BEAN, UNRIPE_LP },
  MILESTONE
} = require('../../src/constants/raw/beanstalk-eth');
const Contracts = require('../../src/datasources/contracts/contracts');
const whitelistedSGResponse = require('../mock-responses/subgraph/silo-service/whitelistedTokens.json');
const { mockBeanstalkSG, mockWrappedSgReturnData } = require('../util/mock-sg');
const { mockBeanstalkConstants } = require('../util/mock-constants');
const SiloService = require('../../src/service/silo-service');
const { C } = require('../../src/constants/runtime-constants');

const defaultOptions = { blockNumber: 19000000 };

describe('SiloService', () => {
  beforeAll(() => {
    const mockBlock = {
      number: defaultOptions.blockNumber,
      timestamp: 1705173443
    };
    jest.spyOn(BlockUtil, 'blockForSubgraphFromOptions').mockResolvedValue(mockBlock);
    mockBeanstalkConstants();
  });

  it('should fetch silov3 grown stalk for requested stalkholders', async () => {
    const accounts = ['0xabcd', '0x1234'];
    const mockBeanstalk = {
      balanceOfGrownStalk: jest.fn().mockImplementation((account, asset) => {
        if (account == accounts[0]) {
          return 50n * BigInt(10 ** 10);
        } else {
          return 15n * BigInt(10 ** 10);
        }
      })
    };

    jest.spyOn(mockBeanstalkSG, 'rawRequest').mockResolvedValueOnce(mockWrappedSgReturnData(whitelistedSGResponse));
    jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    const grownStalk = await getMigratedGrownStalk(accounts, defaultOptions);

    expect(grownStalk.total).toEqual(325);
    expect(grownStalk.accounts[0].account).toEqual(accounts[0]);
    expect(grownStalk.accounts[1].total).toEqual(75);
  });

  it('should fetch pre-silov3 grown stalk', async () => {
    const accounts = ['0xabcd', '0x1234'];

    const siloSGResponse = require('../mock-responses/subgraph/silo-service/depositedBdvs.json');
    jest.spyOn(mockBeanstalkSG, 'rawRequest').mockResolvedValueOnce(mockWrappedSgReturnData(siloSGResponse));
    jest.spyOn(mockBeanstalkSG, 'rawRequest').mockResolvedValueOnce(mockWrappedSgReturnData(whitelistedSGResponse));

    const mockBeanstalk = {
      stemTipForToken: jest.fn().mockImplementation((token, options) => {
        if (options.blockTag == MILESTONE.siloV3Block || token == UNRIPE_BEAN || token == UNRIPE_LP) {
          return 0n;
        } else {
          return 10000n;
        }
      }),
      balanceOfGrownStalkUpToStemsDeployment: jest.fn().mockImplementation((account) => {
        if (account == accounts[0]) {
          return 5000n * BigInt(10 ** 10);
        } else {
          return 150000n * BigInt(10 ** 10);
        }
      })
    };

    jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue(mockBeanstalk);

    const grownStalk = await getUnmigratedGrownStalk(accounts, defaultOptions);

    expect(grownStalk.total).toEqual(155640);
    expect(grownStalk.accounts[0].total).toEqual(150505);
    expect(grownStalk.accounts[0].afterStemsDeployment[BEAN]).toEqual(500);
    expect(grownStalk.accounts[1].total).toEqual(5135);
    expect(grownStalk.accounts[1].afterStemsDeployment[UNRIPE_LP]).toEqual(0);
  });

  describe('batchBdvs', () => {
    test('batchBdvs handles whitelisted tokens', async () => {
      const bdvsFn = jest.fn().mockImplementation((tokens, amounts) => {
        return amounts;
      });
      jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue({
        bdv: jest.fn().mockImplementation((token, amount) => {
          return 1000000n;
        }),
        bdvs: bdvsFn
      });

      const result = await SiloService.batchBdvs(
        { tokens: [C().BEAN, C().BEAN, C().BEAN], amounts: [1000n, 1500n, 2800n] },
        19000000,
        2
      );

      expect(bdvsFn).toHaveBeenCalledTimes(2);
      expect(result.length).toEqual(3);
      expect(result).toEqual([1000n, 1500n, 2800n]);
    });

    test('batchBdvs handles dewhitelisted tokens', async () => {
      const bdvsFn = jest.fn().mockImplementation((tokens, amounts) => {
        return amounts;
      });
      jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue({
        bdv: jest.fn().mockImplementation((token, amount) => {
          throw new Error('Not whitelisted');
        }),
        bdvs: bdvsFn
      });

      const result = await SiloService.batchBdvs(
        { tokens: [C().BEAN, C().BEAN, C().BEAN], amounts: [1000n, 1500n, 2800n] },
        19000000,
        2
      );

      expect(bdvsFn).not.toHaveBeenCalled();
      expect(result.length).toEqual(3);
      expect(result).toEqual([1n, 1n, 1n]);
    });

    test('batchBdvs handles mix of whitelisted and dewhitelisted tokens', async () => {
      const bdvsFn = jest.fn().mockImplementation((tokens, amounts) => {
        return amounts;
      });
      jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue({
        bdv: jest.fn().mockImplementation((token, amount) => {
          if (token === C().WSOL) {
            throw new Error('Not whitelisted');
          }
          return amount;
        }),
        bdvs: bdvsFn
      });

      const result = await SiloService.batchBdvs(
        { tokens: [C().BEAN, C().WSOL, C().BEAN], amounts: [1000n, 1500n, 2800n] },
        19000000,
        2
      );

      expect(bdvsFn).toHaveBeenCalledTimes(1);
      expect(result.length).toEqual(3);
      expect(result).toEqual([1000n, 1n, 2800n]);
    });
  });
});
