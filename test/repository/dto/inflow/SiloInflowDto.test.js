const SiloInflowDto = require('../../../../src/repository/dto/inflow/SiloInflowDto');
const { C } = require('../../../../src/constants/runtime-constants');
const { mockPintoConstants } = require('../../../util/mock-constants');

describe('SiloInflowDto', () => {
  beforeEach(() => {
    mockPintoConstants();
  });

  const baseData = {
    account: 'abc',
    token: C().BEAN,
    amount: 100n,
    isTransfer: false,
    isPlenty: false,
    block: 100,
    timestamp: 1234567890,
    txnHash: '0xabc123'
  };

  describe('fromData - basic construction', () => {
    test('Creates DTO with correct properties', () => {
      const dto = SiloInflowDto.fromData(baseData);

      expect(dto.account).toBe('abc');
      expect(dto.token).toBe(C().BEAN);
      expect(dto.amount).toBe(100n);
      expect(dto.isTransfer).toBe(false);
      expect(dto.isPlenty).toBe(false);
      expect(dto.isLp).toBe(false);
      expect(dto.block).toBe(100);
      expect(dto.timestamp).toBe(1234567890);
      expect(dto.txnHash).toBe('0xabc123');
      expect(dto.accountFieldNegationBdv).toBe(0n);
      expect(dto.protocolFieldNegationBdv).toBe(0n);
    });

    test('Sets isLp to true for non-Bean tokens', () => {
      const dto = SiloInflowDto.fromData({ ...baseData, token: C().PINTOWETH });

      expect(dto.isLp).toBe(true);
    });

    test('Sets isTransfer flag', () => {
      const dto = SiloInflowDto.fromData({ ...baseData, isTransfer: true });

      expect(dto.isTransfer).toBe(true);
    });

    test('Sets isPlenty flag', () => {
      const dto = SiloInflowDto.fromData({ ...baseData, isPlenty: true });

      expect(dto.isPlenty).toBe(true);
    });
  });

  describe('assignInstValues - basic assignment', () => {
    test('Assigns BDV and USD values', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = {};

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.bdv).toBe(100n);
      expect(dto.usd).toBeCloseTo(0.0001, 6);
    });

    test('Uses provided BDV price for USD calculations', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = {};

      await dto.assignInstValues(100n, 1.5, netFieldBdvInflows);

      expect(dto.usd).toBeCloseTo(0.00015, 6);
    });

    test('Handles negative BDV', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = {};

      await dto.assignInstValues(-100n, 1.0, netFieldBdvInflows);

      expect(dto.bdv).toBe(-100n);
      expect(dto.usd).toBeCloseTo(-0.0001, 6);
    });
  });

  describe('assignInstValues - negations', () => {
    test('No negation when both flows are positive', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: 50n, protocol: 50n };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(0n);
      expect(dto.accountFieldNegationUsd).toBe(0);
      expect(dto.protocolFieldNegationBdv).toBe(0n);
      expect(dto.protocolFieldNegationUsd).toBe(0);
      expect(netFieldBdvInflows.abc).toBe(50n);
      expect(netFieldBdvInflows.protocol).toBe(50n);
    });

    test('No negation when both flows are negative', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: -50n, protocol: -50n };

      await dto.assignInstValues(-100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(0n);
      expect(dto.accountFieldNegationUsd).toBe(0);
      expect(dto.protocolFieldNegationBdv).toBe(0n);
      expect(dto.protocolFieldNegationUsd).toBe(0);
      expect(netFieldBdvInflows.abc).toBe(-50n);
      expect(netFieldBdvInflows.protocol).toBe(-50n);
    });

    test('Full negation when silo deposit equals field harvest', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: -100n, protocol: -100n };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(-100n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(dto.protocolFieldNegationBdv).toBe(-100n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when silo deposit is larger than field harvest', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: -50n, protocol: -50n };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(-50n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(-0.00005, 6);
      expect(dto.protocolFieldNegationBdv).toBe(-50n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(-0.00005, 6);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when field harvest is larger than silo deposit', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: -200n, protocol: -200n };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(-100n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(dto.protocolFieldNegationBdv).toBe(-100n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(netFieldBdvInflows.abc).toBe(-100n);
      expect(netFieldBdvInflows.protocol).toBe(-100n);
    });

    test('Full negation when silo withdrawal equals field sow', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: 100n, protocol: 100n };

      await dto.assignInstValues(-100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(100n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(0.0001, 6);
      expect(dto.protocolFieldNegationBdv).toBe(100n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(0.0001, 6);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when silo withdrawal is larger than field sow', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: 50n, protocol: 50n };

      await dto.assignInstValues(-100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(50n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(0.00005, 6);
      expect(dto.protocolFieldNegationBdv).toBe(50n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(0.00005, 6);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when field sow is larger than silo withdrawal', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { abc: 200n, protocol: 200n };

      await dto.assignInstValues(-100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(100n);
      expect(dto.accountFieldNegationUsd).toBeCloseTo(0.0001, 6);
      expect(dto.protocolFieldNegationBdv).toBe(100n);
      expect(dto.protocolFieldNegationUsd).toBeCloseTo(0.0001, 6);
      expect(netFieldBdvInflows.abc).toBe(100n);
      expect(netFieldBdvInflows.protocol).toBe(100n);
    });

    test('No negation when account not in netFieldBdvInflows', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = { def: 100n, protocol: -100n };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(0n);
      expect(dto.protocolFieldNegationBdv).toBe(-100n);
      expect(netFieldBdvInflows.abc).toBeUndefined();
      expect(netFieldBdvInflows.def).toBe(100n);
      expect(netFieldBdvInflows.protocol).toBe(0n);
    });

    test('Account and protocol can have different negation amounts', async () => {
      const dto = SiloInflowDto.fromData(baseData);
      const netFieldBdvInflows = {
        abc: -50n,
        protocol: -200n
      };

      await dto.assignInstValues(100n, 1.0, netFieldBdvInflows);

      expect(dto.accountFieldNegationBdv).toBe(-50n);
      expect(dto.protocolFieldNegationBdv).toBe(-100n);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(-100n);
    });

    test('Multiple DTOs update same netFieldBdvInflows progressively', async () => {
      const netFieldBdvInflows = {
        abc: -300n,
        protocol: -500n
      };

      const dto1 = SiloInflowDto.fromData(baseData);
      await dto1.assignInstValues(100n, 1.0, netFieldBdvInflows);
      expect(dto1.accountFieldNegationBdv).toBe(-100n);
      expect(dto1.protocolFieldNegationBdv).toBe(-100n);
      expect(netFieldBdvInflows.abc).toBe(-200n);
      expect(netFieldBdvInflows.protocol).toBe(-400n);

      const dto2 = SiloInflowDto.fromData({ ...baseData, account: 'abc' });
      await dto2.assignInstValues(150n, 1.0, netFieldBdvInflows);
      expect(dto2.accountFieldNegationBdv).toBe(-150n);
      expect(dto2.protocolFieldNegationBdv).toBe(-150n);
      expect(netFieldBdvInflows.abc).toBe(-50n);
      expect(netFieldBdvInflows.protocol).toBe(-250n);

      const dto3 = SiloInflowDto.fromData({ ...baseData, account: 'abc' });
      await dto3.assignInstValues(100n, 1.0, netFieldBdvInflows);
      expect(dto3.accountFieldNegationBdv).toBe(-50n);
      expect(dto3.protocolFieldNegationBdv).toBe(-100n);
      expect(netFieldBdvInflows.abc).toBe(0n);
      expect(netFieldBdvInflows.protocol).toBe(-150n);
    });
  });

  describe('fromModel', () => {
    test('Creates DTO from database model', () => {
      const model = {
        id: 1,
        account: 'abc',
        token: C().BEAN,
        amount: 100n,
        bdv: 100n,
        usd: 0.0001,
        isLp: false,
        isTransfer: false,
        isPlenty: false,
        accountFieldNegationBdv: -50n,
        accountFieldNegationUsd: -0.00005,
        protocolFieldNegationBdv: -50n,
        protocolFieldNegationUsd: -0.00005,
        block: 100,
        timestamp: 1234567890,
        txnHash: '0xabc123'
      };

      const dto = SiloInflowDto.fromModel(model);

      expect(dto.id).toBe(1);
      expect(dto.account).toBe('abc');
      expect(dto.token).toBe(C().BEAN);
      expect(dto.amount).toBe(100n);
      expect(dto.bdv).toBe(100n);
      expect(dto.usd).toBe(0.0001);
      expect(dto.isLp).toBe(false);
      expect(dto.isTransfer).toBe(false);
      expect(dto.isPlenty).toBe(false);
      expect(dto.accountFieldNegationBdv).toBe(-50n);
      expect(dto.accountFieldNegationUsd).toBe(-0.00005);
      expect(dto.protocolFieldNegationBdv).toBe(-50n);
      expect(dto.protocolFieldNegationUsd).toBe(-0.00005);
      expect(dto.block).toBe(100);
      expect(dto.timestamp).toBe(1234567890);
      expect(dto.txnHash).toBe('0xabc123');
    });
  });
});
