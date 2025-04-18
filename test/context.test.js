const { sequelize } = require('../src/repository/postgres/models');
const AsyncContext = require('../src/utils/async/context');
const { mockBeanstalkConstants } = require('./util/mock-constants');

describe('AsyncContext', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockBeanstalkConstants();
  });

  test('Retrieves stored state variables', async () => {
    expect(() => AsyncContext.get('var')).toThrow();
    await AsyncContext.run({ var: 'abc' }, () => {
      expect(() => AsyncContext.get('var')).not.toThrow();
    });
    expect(() => AsyncContext.get('var')).toThrow();
  });

  describe('Sequelize transaction management', () => {
    test('Manages transaction lifecycle', async () => {
      const mockTxn = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      const txnSpy = jest.spyOn(sequelize, 'transaction').mockResolvedValue(mockTxn);

      await expect(
        AsyncContext.sequelizeTransaction(async () => {
          expect(AsyncContext.getOrUndef('transaction')).toBeDefined();
        })
      ).resolves.toBeUndefined();

      expect(txnSpy).toHaveBeenCalled();
      expect(mockTxn.commit).toHaveBeenCalled();

      jest.clearAllMocks();

      await expect(
        AsyncContext.sequelizeTransaction(async () => {
          throw new Error('Callback error');
        })
      ).rejects.toBeDefined();

      expect(txnSpy).toHaveBeenCalled();
      expect(mockTxn.commit).not.toHaveBeenCalled();
      expect(mockTxn.rollback).toHaveBeenCalled();
    });

    test('Preserves existing context values', async () => {
      await AsyncContext.run({ outer: 'abc' }, async () => {
        expect(AsyncContext.getOrUndef('outer')).toBeDefined();
        expect(AsyncContext.getOrUndef('transaction')).not.toBeDefined();
        await AsyncContext.sequelizeTransaction(async () => {
          expect(AsyncContext.getOrUndef('outer')).toBeDefined();
          expect(AsyncContext.getOrUndef('transaction')).toBeDefined();
        });
        expect(AsyncContext.getOrUndef('outer')).toBeDefined();
        expect(AsyncContext.getOrUndef('transaction')).not.toBeDefined();
      });
      expect(AsyncContext.getOrUndef('outer')).not.toBeDefined();
      expect(AsyncContext.getOrUndef('transaction')).not.toBeDefined();
    });

    test('Does not doubly open a transaction', async () => {
      const mockTxn = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      const txnSpy = jest.spyOn(sequelize, 'transaction').mockResolvedValue(mockTxn);
      await AsyncContext.sequelizeTransaction(async () => {
        await AsyncContext.sequelizeTransaction(async () => {});
      });

      expect(txnSpy).toHaveBeenCalledTimes(1);
      expect(mockTxn.commit).toHaveBeenCalledTimes(1);
    });
  });
});
