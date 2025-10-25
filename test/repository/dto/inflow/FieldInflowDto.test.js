const FieldInflowDto = require('../../../../src/repository/dto/inflow/FieldInflowDto');

describe('FieldInflowDto', () => {
  const baseData = {
    account: 'abc',
    beans: 100n,
    beanPrice: 1.0,
    isMarket: false,
    block: 100,
    timestamp: 1234567890,
    txnHash: '0xabc123'
  };

  describe('fromData - basic construction', () => {
    test('Creates DTO with correct properties', () => {
      const netSiloBdvInflows = {};
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.account).toBe('abc');
      expect(dto.beans).toBe(100n);
      expect(dto.isMarket).toBe(false);
      expect(dto.block).toBe(100);
      expect(dto.timestamp).toBe(1234567890);
      expect(dto.txnHash).toBe('0xabc123');
    });

    test('Calculates USD value correctly', () => {
      const netSiloBdvInflows = {};
      const dto = FieldInflowDto.fromData({ ...baseData, beans: 1000000n, beanPrice: 1.5 }, netSiloBdvInflows);

      expect(dto.usd).toBeCloseTo(1.5, 6);
    });

    test('Sets isMarket flag', () => {
      const netSiloBdvInflows = {};
      const dto = FieldInflowDto.fromData({ ...baseData, isMarket: true }, netSiloBdvInflows);

      expect(dto.isMarket).toBe(true);
    });
  });

  describe('fromData - negations', () => {
    test('No negation when both flows are positive', () => {
      const netSiloBdvInflows = { abc: 50n, protocol: 50n };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(0n);
      expect(dto.accountSiloNegationUsd).toBe(0);
      expect(dto.protocolSiloNegationBdv).toBe(0n);
      expect(dto.protocolSiloNegationUsd).toBe(0);
      expect(netSiloBdvInflows.abc).toBe(50n);
      expect(netSiloBdvInflows.protocol).toBe(50n);
    });

    test('No negation when both flows are negative', () => {
      const netSiloBdvInflows = { abc: -50n, protocol: -50n };
      const dto = FieldInflowDto.fromData({ ...baseData, beans: -100n }, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(0n);
      expect(dto.accountSiloNegationUsd).toBe(0);
      expect(dto.protocolSiloNegationBdv).toBe(0n);
      expect(dto.protocolSiloNegationUsd).toBe(0);
      expect(netSiloBdvInflows.abc).toBe(-50n);
      expect(netSiloBdvInflows.protocol).toBe(-50n);
    });

    test('Full negation when field inflow equals silo outflow', () => {
      const netSiloBdvInflows = { abc: -100n, protocol: -100n };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(-100n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(dto.protocolSiloNegationBdv).toBe(-100n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when field inflow is larger than silo outflow', () => {
      const netSiloBdvInflows = { abc: -50n, protocol: -50n };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(-50n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(-0.00005, 6);
      expect(dto.protocolSiloNegationBdv).toBe(-50n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(-0.00005, 6);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when silo outflow is larger than field inflow', () => {
      const netSiloBdvInflows = { abc: -200n, protocol: -200n };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(-100n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(dto.protocolSiloNegationBdv).toBe(-100n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(-0.0001, 6);
      expect(netSiloBdvInflows.abc).toBe(-100n);
      expect(netSiloBdvInflows.protocol).toBe(-100n);
    });

    test('Full negation when field outflow equals silo inflow', () => {
      const netSiloBdvInflows = { abc: 100n, protocol: 100n };
      const dto = FieldInflowDto.fromData({ ...baseData, beans: -100n }, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(100n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(0.0001, 6);
      expect(dto.protocolSiloNegationBdv).toBe(100n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(0.0001, 6);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when field outflow is larger than silo inflow', () => {
      const netSiloBdvInflows = { abc: 50n, protocol: 50n };
      const dto = FieldInflowDto.fromData({ ...baseData, beans: -100n }, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(50n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(0.00005, 6);
      expect(dto.protocolSiloNegationBdv).toBe(50n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(0.00005, 6);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(0n);
    });

    test('Partial negation when silo inflow is larger than field outflow', () => {
      const netSiloBdvInflows = { abc: 200n, protocol: 200n };
      const dto = FieldInflowDto.fromData({ ...baseData, beans: -100n }, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(100n);
      expect(dto.accountSiloNegationUsd).toBeCloseTo(0.0001, 6);
      expect(dto.protocolSiloNegationBdv).toBe(100n);
      expect(dto.protocolSiloNegationUsd).toBeCloseTo(0.0001, 6);
      expect(netSiloBdvInflows.abc).toBe(100n);
      expect(netSiloBdvInflows.protocol).toBe(100n);
    });

    test('No negation when account not in netSiloBdvInflows', () => {
      const netSiloBdvInflows = { def: 100n, protocol: 100n };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(0n);
      expect(dto.protocolSiloNegationBdv).toBe(0n);
      expect(netSiloBdvInflows.abc).toBeUndefined();
      expect(netSiloBdvInflows.def).toBe(100n);
      expect(netSiloBdvInflows.protocol).toBe(100n);
    });

    test('Account and protocol can have different negation amounts', () => {
      const netSiloBdvInflows = {
        abc: -50n,
        protocol: -200n
      };
      const dto = FieldInflowDto.fromData(baseData, netSiloBdvInflows);

      expect(dto.accountSiloNegationBdv).toBe(-50n);
      expect(dto.protocolSiloNegationBdv).toBe(-100n);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(-100n);
    });

    test('Multiple DTOs update same netSiloBdvInflows progressively', () => {
      const netSiloBdvInflows = {
        abc: -300n,
        protocol: -500n
      };

      const dto1 = FieldInflowDto.fromData(baseData, netSiloBdvInflows);
      expect(dto1.accountSiloNegationBdv).toBe(-100n);
      expect(dto1.protocolSiloNegationBdv).toBe(-100n);
      expect(netSiloBdvInflows.abc).toBe(-200n);
      expect(netSiloBdvInflows.protocol).toBe(-400n);

      const dto2 = FieldInflowDto.fromData({ ...baseData, account: 'abc', beans: 150n }, netSiloBdvInflows);
      expect(dto2.accountSiloNegationBdv).toBe(-150n);
      expect(dto2.protocolSiloNegationBdv).toBe(-150n);
      expect(netSiloBdvInflows.abc).toBe(-50n);
      expect(netSiloBdvInflows.protocol).toBe(-250n);

      const dto3 = FieldInflowDto.fromData({ ...baseData, account: 'abc', beans: 100n }, netSiloBdvInflows);
      expect(dto3.accountSiloNegationBdv).toBe(-50n);
      expect(dto3.protocolSiloNegationBdv).toBe(-100n);
      expect(netSiloBdvInflows.abc).toBe(0n);
      expect(netSiloBdvInflows.protocol).toBe(-150n);
    });
  });

  describe('fromModel', () => {
    test('Creates DTO from database model', () => {
      const model = {
        id: 1,
        account: 'abc',
        beans: 100n,
        usd: 0.0001,
        isMarket: false,
        accountSiloNegationBdv: -50n,
        accountSiloNegationUsd: -0.00005,
        protocolSiloNegationBdv: -50n,
        protocolSiloNegationUsd: -0.00005,
        block: 100,
        timestamp: 1234567890,
        txnHash: '0xabc123'
      };

      const dto = FieldInflowDto.fromModel(model);

      expect(dto.id).toBe(1);
      expect(dto.account).toBe('abc');
      expect(dto.beans).toBe(100n);
      expect(dto.usd).toBe(0.0001);
      expect(dto.isMarket).toBe(false);
      expect(dto.accountSiloNegationBdv).toBe(-50n);
      expect(dto.accountSiloNegationUsd).toBe(-0.00005);
      expect(dto.protocolSiloNegationBdv).toBe(-50n);
      expect(dto.protocolSiloNegationUsd).toBe(-0.00005);
      expect(dto.block).toBe(100);
      expect(dto.timestamp).toBe(1234567890);
      expect(dto.txnHash).toBe('0xabc123');
    });
  });
});
