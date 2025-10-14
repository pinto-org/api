const { C } = require('../../src/constants/runtime-constants');
const SiloInflowsTask = require('../../src/scheduled/tasks/silo-inflows');
const SiloInflowsUtil = require('../../src/scheduled/util/silo-inflows');
const { mockPintoConstants } = require('../util/mock-constants');

describe('Silo inflows task', () => {
  beforeEach(() => {
    mockPintoConstants();
  });

  describe('Dto construction', () => {
    beforeEach(() => {
      jest.spyOn(SiloInflowsUtil, 'assignInflowBdvAndUsd').mockImplementation(() => {});
    });

    test('No transfers', async () => {
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().BEAN]: {
            abc: {
              amount: 100n,
              transferPct: 0
            }
          }
        },
        {
          block: 100,
          timestamp: 100,
          txnHash: '0x123'
        }
      );

      expect(result.length).toBe(1);
      expect(result[0].account).toBe('abc');
      expect(result[0].token).toBe(C().BEAN);
      expect(result[0].amount).toBe(100n);
      expect(result[0].isTransfer).toBe(false);
      expect(result[0].isLp).toBe(false);
    });

    test('Full transfer', async () => {
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().PINTOWETH]: {
            abc: {
              amount: 200n,
              transferPct: 1
            }
          }
        },
        {
          block: 100,
          timestamp: 100,
          txnHash: '0x123'
        }
      );

      expect(result.length).toBe(1);
      expect(result[0].amount).toBe(200n);
      expect(result[0].isTransfer).toBe(true);
      expect(result[0].isLp).toBe(true);
    });

    test('Partial transfer', async () => {
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().PINTOWETH]: {
            abc: {
              amount: 500n,
              transferPct: 0.4
            }
          }
        },
        {
          block: 100,
          timestamp: 100,
          txnHash: '0x123'
        }
      );

      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(200n);
      expect(result[0].isTransfer).toBe(true);
      expect(result[1].amount).toBe(300n);
      expect(result[1].isTransfer).toBe(false);
    });
  });
});
