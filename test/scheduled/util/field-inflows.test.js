const FieldInflowsUtil = require('../../../src/scheduled/util/field-inflows');

describe('FieldInflowsUtil', () => {
  describe('netBdvInflows', () => {
    test('Single Sow event', () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.abc).toBe(100n);
      expect(result.protocol).toBe(100n);
    });

    test('Sow and Harvest for same account', () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        },
        {
          name: 'Harvest',
          args: {
            account: 'abc',
            beans: 30n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.abc).toBe(70n);
      expect(result.protocol).toBe(70n);
    });

    test('Multiple accounts', () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        },
        {
          name: 'Sow',
          args: {
            account: 'def',
            beans: 200n
          },
          _beansSown: 200n
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.abc).toBe(100n);
      expect(result.def).toBe(200n);
      expect(result.protocol).toBe(300n);
    });

    test('PodListingFilled event', () => {
      const events = [
        {
          name: 'PodListingFilled',
          args: {
            filler: 'buyer',
            lister: 'seller',
            costInBeans: 100n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.buyer).toBe(100n);
      expect(result.seller).toBe(-100n);
      expect(result.protocol).toBe(0n);
    });

    test('PodOrderFilled event', () => {
      const events = [
        {
          name: 'PodOrderFilled',
          args: {
            orderer: 'buyer',
            filler: 'seller',
            costInBeans: 150n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.buyer).toBe(150n);
      expect(result.seller).toBe(-150n);
      expect(result.protocol).toBe(0n);
    });

    test('Multiple market events', () => {
      const events = [
        {
          name: 'PodListingFilled',
          args: {
            filler: 'buyer1',
            lister: 'seller1',
            costInBeans: 100n
          }
        },
        {
          name: 'PodOrderFilled',
          args: {
            orderer: 'buyer2',
            filler: 'seller2',
            costInBeans: 200n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.buyer1).toBe(100n);
      expect(result.seller1).toBe(-100n);
      expect(result.buyer2).toBe(200n);
      expect(result.seller2).toBe(-200n);
      expect(result.protocol).toBe(0n);
    });

    test('Combined Sow/Harvest and Market events', () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'farmer',
            beans: 500n
          },
          _beansSown: 500n
        },
        {
          name: 'Harvest',
          args: {
            account: 'farmer',
            beans: 100n
          }
        },
        {
          name: 'PodListingFilled',
          args: {
            filler: 'buyer',
            lister: 'seller',
            costInBeans: 200n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.farmer).toBe(400n);
      expect(result.buyer).toBe(200n);
      expect(result.seller).toBe(-200n);
      expect(result.protocol).toBe(400n);
    });

    test('Same account in multiple roles', () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 500n
          },
          _beansSown: 500n
        },
        {
          name: 'PodListingFilled',
          args: {
            filler: 'abc',
            lister: 'def',
            costInBeans: 100n
          }
        },
        {
          name: 'Harvest',
          args: {
            account: 'abc',
            beans: 50n
          }
        }
      ];

      const result = FieldInflowsUtil.netBdvInflows(events);

      expect(result.abc).toBe(550n);
      expect(result.def).toBe(-100n);
      expect(result.protocol).toBe(450n);
    });
  });

  describe('inflowsFromFieldEvents', () => {
    const mockMetadata = {
      block: 100,
      timestamp: 1234567890,
      txnHash: '0xabc123',
      beanPrice: 0.9
    };

    test('Single Sow event creates DTO', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(1);
      expect(result[0].account).toBe('abc');
      expect(result[0].beans).toBe(100n);
      expect(result[0].isMarket).toBe(false);
      expect(result[0].block).toBe(100);
      expect(result[0].timestamp).toBe(1234567890);
      expect(result[0].txnHash).toBe('0xabc123');
    });

    test('Market event creates DTO with isMarket flag', async () => {
      const events = [
        {
          name: 'PodListingFilled',
          args: {
            filler: 'buyer',
            lister: 'seller',
            costInBeans: 100n
          }
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(2);
      const buyerDto = result.find((r) => r.account === 'buyer');
      const sellerDto = result.find((r) => r.account === 'seller');

      expect(buyerDto.isMarket).toBe(true);
      expect(sellerDto.isMarket).toBe(true);
    });

    test('Multiple Sow/Harvest for same account collapses', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        },
        {
          name: 'Harvest',
          args: {
            account: 'abc',
            beans: 30n
          }
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(1);
      expect(result[0].account).toBe('abc');
      expect(result[0].beans).toBe(70n);
      expect(result[0].isMarket).toBe(false);
    });

    test('Different accounts create separate DTOs', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        },
        {
          name: 'Sow',
          args: {
            account: 'def',
            beans: 200n
          },
          _beansSown: 200n
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(2);
      expect(result.find((r) => r.account === 'abc').beans).toBe(100n);
      expect(result.find((r) => r.account === 'def').beans).toBe(200n);
    });

    test('Mixed Sow/Harvest and Market events', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'farmer',
            beans: 500n
          },
          _beansSown: 500n
        },
        {
          name: 'PodListingFilled',
          args: {
            filler: 'buyer',
            lister: 'seller',
            costInBeans: 100n
          }
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(3);
      expect(result.find((r) => r.account === 'farmer').isMarket).toBe(false);
      expect(result.find((r) => r.account === 'buyer').isMarket).toBe(true);
      expect(result.find((r) => r.account === 'seller').isMarket).toBe(true);
    });

    test('Account that appears in both Sow/Harvest and Market gets two DTOs', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 500n
          },
          _beansSown: 500n
        },
        {
          name: 'PodListingFilled',
          args: {
            filler: 'abc',
            lister: 'def',
            costInBeans: 100n
          }
        }
      ];

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, mockMetadata);

      expect(result.length).toBe(3);
      const abcDtos = result.filter((r) => r.account === 'abc');
      expect(abcDtos.length).toBe(2);
      expect(abcDtos.find((d) => !d.isMarket).beans).toBe(500n);
      expect(abcDtos.find((d) => d.isMarket)).toBeDefined();
    });

    test('Uses provided bean price in DTO', async () => {
      const events = [
        {
          name: 'Sow',
          args: {
            account: 'abc',
            beans: 100n
          },
          _beansSown: 100n
        }
      ];

      const customMetadata = {
        ...mockMetadata,
        beanPrice: 1.5
      };

      const netSiloBdvInflows = {};
      const result = FieldInflowsUtil.inflowsFromFieldEvents(events, netSiloBdvInflows, customMetadata);

      expect(result[0].usd).toBeCloseTo(0.00015, 6);
    });
  });
});
