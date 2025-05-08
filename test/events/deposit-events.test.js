const { C } = require('../../src/constants/runtime-constants');
const DepositEvents = require('../../src/datasources/events/deposit-events');
const { mockPintoConstants } = require('../util/mock-constants');

describe('Deposit Events', () => {
  describe('Event removal', () => {
    let addRemoveEvents;

    beforeEach(() => {
      mockPintoConstants();

      addRemoveEvents = [
        {
          name: 'AddDeposit',
          args: {
            account: 'abc',
            token: C().BEAN,
            amount: 500n
          }
        },
        {
          name: 'AddDeposit',
          args: {
            account: 'abc',
            token: C().PINTOWETH,
            amount: 2500n
          }
        },
        {
          name: 'RemoveDeposit',
          args: {
            account: 'abc',
            token: C().BEAN,
            amount: 50n
          }
        },
        {
          name: 'RemoveDeposit',
          args: {
            account: 'abc',
            token: C().BEAN,
            amount: 1000n
          }
        }
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
      //
    });

    test('Summing multiple events', () => {
      //
    });

    test('Transfer (full)', () => {
      //
    });

    test('Transfer (partial)', () => {
      //
    });
  });
});
