const { C } = require('../../src/constants/runtime-constants');
const DepositEvents = require('../../src/datasources/events/deposit-events');
const { mockPintoConstants } = require('../util/mock-constants');

const mockAddRemoveEvt = (name, account, token, amount) => {
  return {
    name,
    args: {
      account,
      token,
      amount,
      stem: 0,
      bdv: amount
    }
  };
};

describe('Deposit Events', () => {
  describe('Event removal', () => {
    let addRemoveEvents;

    beforeEach(() => {
      mockPintoConstants();

      addRemoveEvents = [
        mockAddRemoveEvt('AddDeposit', 'abc', C().BEAN, 500n),
        mockAddRemoveEvt('AddDeposit', 'abc', C().PINTOWETH, 2500n),
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().BEAN, 50n),
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().BEAN, 1000n)
      ];
    });

    test('Removes convert related events', () => {
      DepositEvents.removeConvertRelatedEvents(addRemoveEvents, [
        {
          args: {
            account: 'abc',
            fromToken: C().BEAN,
            fromAmount: 1000n,
            toToken: C().PINTOWETH,
            toAmount: 2500n
          }
        }
      ]);

      expect(addRemoveEvents.length).toBe(2);
      expect(addRemoveEvents[0].args.amount).toBe(500n);
      expect(addRemoveEvents[1].args.amount).toBe(50n);
    });

    test('Does not remove convert unrelated events', () => {
      DepositEvents.removeConvertRelatedEvents(addRemoveEvents, [
        {
          args: {
            account: 'abc',
            fromToken: C().BEAN,
            fromAmount: 1001n,
            toToken: C().PINTOWETH,
            toAmount: 2500n
          }
        },
        {
          args: {
            account: 'abcd',
            fromToken: C().BEAN,
            fromAmount: 1000n,
            toToken: C().PINTOWETH,
            toAmount: 2500n
          }
        }
      ]);

      expect(addRemoveEvents.length).toBe(4);
    });

    test('Removes plant related events', () => {
      DepositEvents.removePlantRelatedEvents(addRemoveEvents, [
        {
          args: {
            account: 'abc',
            beans: 500n
          }
        }
      ]);

      expect(addRemoveEvents.length).toBe(3);
      expect(addRemoveEvents[0].args.amount).not.toBe(500n);
    });

    test('Does not remove plant unrelated events', () => {
      DepositEvents.removePlantRelatedEvents(addRemoveEvents, [
        {
          args: {
            account: 'abc',
            beans: 2500n
          }
        },
        {
          args: {
            account: 'abc',
            beans: 50n
          }
        }
      ]);

      expect(addRemoveEvents.length).toBe(4);
    });
  });

  describe('Net Deposits', () => {
    test('Multiple Tokens', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('AddDeposit', 'abc', C().BEAN, 100n),
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().PINTOWETH, 200n)
      ]);

      expect(result[C().BEAN]['abc'].amount).toBe(100n);
      expect(result[C().PINTOWETH]['abc'].amount).toBe(-200n);
    });

    test('Multiple Accounts', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('AddDeposit', 'abc', C().BEAN, 100n),
        mockAddRemoveEvt('RemoveDeposit', 'abcd', C().PINTOWETH, 200n)
      ]);

      expect(result[C().BEAN]['abc'].amount).toBe(100n);
      expect(result[C().PINTOWETH]['abcd'].amount).toBe(-200n);
    });

    test('Summing multiple events', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('AddDeposit', 'abc', C().BEAN, 100n),
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().BEAN, 200n)
      ]);

      expect(result[C().BEAN]['abc'].amount).toBe(-100n);
    });

    test('Transfer (full)', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().BEAN, 500n),
        mockAddRemoveEvt('AddDeposit', 'xyz', C().BEAN, 500n)
      ]);

      expect(result[C().BEAN]['abc'].amount).toBe(-500n);
      expect(result[C().BEAN]['abc'].transferPct).toBe(1);
      expect(result[C().BEAN]['xyz'].amount).toBe(500n);
      expect(result[C().BEAN]['xyz'].transferPct).toBe(1);
    });

    test('Transfer (partial)', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('RemoveDeposit', 'abc', C().BEAN, 500n),
        mockAddRemoveEvt('AddDeposit', 'xyz', C().BEAN, 400n)
      ]);

      expect(result[C().BEAN]['abc'].amount).toBe(-500n);
      expect(result[C().BEAN]['abc'].transferPct).toBe(0.8);
      expect(result[C().BEAN]['xyz'].amount).toBe(400n);
      expect(result[C().BEAN]['xyz'].transferPct).toBe(1);
    });

    test('Transfer (laddered partial)', () => {
      const result = DepositEvents.netDeposits([
        mockAddRemoveEvt('RemoveDeposit', '1', C().BEAN, 500n),
        mockAddRemoveEvt('RemoveDeposit', '2', C().BEAN, 100n),
        mockAddRemoveEvt('RemoveDeposit', '3', C().BEAN, 300n),
        mockAddRemoveEvt('AddDeposit', '4', C().BEAN, 500n),
        mockAddRemoveEvt('AddDeposit', '5', C().BEAN, 300n)
      ]);

      expect(result[C().BEAN]['1'].transferPct).toBe(1);
      expect(result[C().BEAN]['2'].transferPct).toBe(1);
      expect(result[C().BEAN]['3'].transferPct).toBeCloseTo(2 / 3, 5);
      expect(result[C().BEAN]['4'].transferPct).toBe(1);
      expect(result[C().BEAN]['5'].transferPct).toBe(1);
    });
  });
});
