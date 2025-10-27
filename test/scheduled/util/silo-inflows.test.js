const { C } = require('../../../src/constants/runtime-constants');
const SiloInflowsUtil = require('../../../src/scheduled/util/silo-inflows');
const SiloEvents = require('../../../src/datasources/events/silo-events');
const { mockPintoConstants } = require('../../util/mock-constants');

describe('SiloInflowsUtil', () => {
  beforeEach(() => {
    mockPintoConstants();
  });

  describe('Dto construction', () => {
    beforeEach(() => {
      jest.spyOn(SiloInflowsUtil, 'assignInflowBdvAndUsd').mockImplementation(() => {});
    });

    const mockMetadata = {
      block: 100,
      timestamp: 100,
      txnHash: '0x123',
      beanPrice: 0.9
    };

    test('No transfers', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().BEAN]: {
            abc: {
              amount: 100n,
              bdv: 100n,
              transferPct: 0
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(1);
      expect(result[0].account).toBe('abc');
      expect(result[0].token).toBe(C().BEAN);
      expect(result[0].amount).toBe(100n);
      expect(result[0].isTransfer).toBe(false);
      expect(result[0].isLp).toBe(false);
      expect(result[0].block).toBe(100);
      expect(result[0].timestamp).toBe(100);
      expect(result[0].txnHash).toBe('0x123');
    });

    test('Full transfer', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().PINTOWETH]: {
            abc: {
              amount: 200n,
              bdv: 200n,
              transferPct: 1
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(1);
      expect(result[0].account).toBe('abc');
      expect(result[0].token).toBe(C().PINTOWETH);
      expect(result[0].amount).toBe(200n);
      expect(result[0].isTransfer).toBe(true);
      expect(result[0].isLp).toBe(true);
    });

    test('Partial transfer', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().PINTOWETH]: {
            abc: {
              amount: 500n,
              bdv: 500n,
              transferPct: 0.4
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(200n);
      expect(result[0].isTransfer).toBe(true);
      expect(result[0].isLp).toBe(true);
      expect(result[1].amount).toBe(300n);
      expect(result[1].isTransfer).toBe(false);
      expect(result[1].isLp).toBe(true);
    });

    test('Multiple accounts, no transfers', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().BEAN]: {
            abc: {
              amount: 100n,
              bdv: 100n,
              transferPct: 0
            },
            def: {
              amount: 200n,
              bdv: 200n,
              transferPct: 0
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(2);
      expect(result[0].account).toBe('abc');
      expect(result[0].amount).toBe(100n);
      expect(result[0].isTransfer).toBe(false);
      expect(result[1].account).toBe('def');
      expect(result[1].amount).toBe(200n);
      expect(result[1].isTransfer).toBe(false);
    });

    test('Multiple tokens', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().BEAN]: {
            abc: {
              amount: 100n,
              bdv: 100n,
              transferPct: 0
            }
          },
          [C().PINTOWETH]: {
            def: {
              amount: 200n,
              bdv: 200n,
              transferPct: 1
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(2);
      const beanInflow = result.find((r) => r.token === C().BEAN);
      const lpInflow = result.find((r) => r.token === C().PINTOWETH);

      expect(beanInflow.account).toBe('abc');
      expect(beanInflow.isTransfer).toBe(false);
      expect(beanInflow.isLp).toBe(false);

      expect(lpInflow.account).toBe('def');
      expect(lpInflow.isTransfer).toBe(true);
      expect(lpInflow.isLp).toBe(true);
    });

    test('Negative amount (withdrawal)', async () => {
      const netFieldBdvInflows = {};
      const result = await SiloInflowsUtil.inflowsFromNetDeposits(
        {
          [C().BEAN]: {
            abc: {
              amount: -100n,
              bdv: -100n,
              transferPct: 0
            }
          }
        },
        netFieldBdvInflows,
        mockMetadata
      );

      expect(result.length).toBe(1);
      expect(result[0].amount).toBe(-100n);
      expect(result[0].isTransfer).toBe(false);
    });
  });

  describe('netDeposits', () => {
    beforeEach(() => {
      // Mock collapseDepositEvents to return events as-is (already collapsed in test data)
      jest.spyOn(SiloEvents, 'collapseDepositEvents').mockImplementation((events) => events);
    });

    test('Simple deposit - collapse same events', () => {
      const events = [
        {
          type: 1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        },
        {
          type: 1,
          account: 'abc',
          token: C().BEAN,
          amount: 50n,
          bdv: 50n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN].abc.amount).toBe(150n);
      expect(result[C().BEAN].abc.bdv).toBe(150n);
      expect(result[C().BEAN].abc.transferPct).toBe(0);
    });

    test('Deposit and withdrawal - same account cancels out', () => {
      const events = [
        {
          type: 1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        },
        {
          type: -1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN]).toBeUndefined();
    });

    test('Transfer identification - exact match', () => {
      const events = [
        {
          type: -1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        },
        {
          type: 1,
          account: 'def',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN].abc.amount).toBe(-100n);
      expect(result[C().BEAN].abc.transferPct).toBe(1);
      expect(result[C().BEAN].def.amount).toBe(100n);
      expect(result[C().BEAN].def.transferPct).toBe(1);
    });

    test('Partial transfer - depositor has more', () => {
      const events = [
        {
          type: -1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        },
        {
          type: 1,
          account: 'def',
          token: C().BEAN,
          amount: 150n,
          bdv: 150n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN].abc.amount).toBe(-100n);
      expect(result[C().BEAN].abc.transferPct).toBe(1);
      expect(result[C().BEAN].def.amount).toBe(150n);
      // def should have partial transfer: 100 transferred, 50 from other source
      expect(result[C().BEAN].def.transferPct).toBeCloseTo(100 / 150, 5);
    });

    test('Partial transfer - withdrawer has more', () => {
      const events = [
        {
          type: -1,
          account: 'abc',
          token: C().BEAN,
          amount: 150n,
          bdv: 150n
        },
        {
          type: 1,
          account: 'def',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN].abc.amount).toBe(-150n);
      // abc should have partial transfer: 100 transferred, 50 withdrawn
      expect(result[C().BEAN].abc.transferPct).toBeCloseTo(100 / 150, 5);
      expect(result[C().BEAN].def.amount).toBe(100n);
      expect(result[C().BEAN].def.transferPct).toBe(1);
    });

    test('Different tokens - no transfer identification', () => {
      const events = [
        {
          type: -1,
          account: 'abc',
          token: C().BEAN,
          amount: 100n,
          bdv: 100n
        },
        {
          type: 1,
          account: 'def',
          token: C().PINTOWETH,
          amount: 100n,
          bdv: 100n
        }
      ];

      const result = SiloInflowsUtil.netDeposits(events);

      expect(result[C().BEAN].abc.transferPct).toBe(0);
      expect(result[C().PINTOWETH].def.transferPct).toBe(0);
    });
  });

  describe('netBdvInflows', () => {
    test('Single deposit', () => {
      const netDeposits = {
        [C().BEAN]: {
          abc: {
            amount: 100n,
            bdv: 100n,
            transferPct: 0
          }
        }
      };

      const result = SiloInflowsUtil.netBdvInflows(netDeposits, []);

      expect(result.abc).toBe(100n);
      expect(result.protocol).toBe(100n);
    });

    test('Multiple accounts', () => {
      const netDeposits = {
        [C().BEAN]: {
          abc: {
            amount: 100n,
            bdv: 100n,
            transferPct: 0
          },
          def: {
            amount: 200n,
            bdv: 200n,
            transferPct: 0
          }
        }
      };

      const result = SiloInflowsUtil.netBdvInflows(netDeposits, []);

      expect(result.abc).toBe(100n);
      expect(result.def).toBe(200n);
      expect(result.protocol).toBe(300n);
    });

    test('With claim plenty', () => {
      const netDeposits = {
        [C().BEAN]: {
          abc: {
            amount: 100n,
            bdv: 100n,
            transferPct: 0
          }
        }
      };

      const claimPlenties = [
        {
          args: {
            account: 'abc',
            token: C().BEAN,
            plenty: 50n
          },
          _pseudoBdv: 50 / Math.pow(10, 6)
        }
      ];

      const result = SiloInflowsUtil.netBdvInflows(netDeposits, claimPlenties);

      expect(result.abc).toBe(50n); // 100n deposit - 50n claim
      expect(result.protocol).toBe(50n);
    });

    test('Multiple tokens', () => {
      const netDeposits = {
        [C().BEAN]: {
          abc: {
            amount: 100n,
            bdv: 100n,
            transferPct: 0
          }
        },
        [C().PINTOWETH]: {
          abc: {
            amount: 200n,
            bdv: 200n,
            transferPct: 0
          }
        }
      };

      const result = SiloInflowsUtil.netBdvInflows(netDeposits, []);

      expect(result.abc).toBe(300n);
      expect(result.protocol).toBe(300n);
    });

    test('Negative bdv (withdrawal)', () => {
      const netDeposits = {
        [C().BEAN]: {
          abc: {
            amount: -100n,
            bdv: -100n,
            transferPct: 0
          }
        }
      };

      const result = SiloInflowsUtil.netBdvInflows(netDeposits, []);

      expect(result.abc).toBe(-100n);
      expect(result.protocol).toBe(-100n);
    });
  });
});
