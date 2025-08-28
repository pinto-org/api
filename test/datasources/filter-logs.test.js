const FilterLogs = require('../../src/datasources/events/filter-logs');

describe('FilterLogs', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    const iface1 = {
      getEvent: (evtName) =>
        evtName === 'Event1' ? { topicHash: '0x1234' } : evtName === 'Event2' ? { topicHash: '0x5678' } : null,
      parseLog: jest.fn().mockImplementation((log) => ({ v: `parsed_${log.topics[0]}` }))
    };

    const iface2 = {
      getEvent: (evtName) => (evtName === 'Event1' ? { topicHash: '0xabcd' } : null),
      parseLog: jest.fn().mockImplementation((log) => ({ v: `parsed_${log.topics[0]}` }))
    };

    // Events from each interface
    const evt1_1 = { topics: ['0x1234'] };
    const evt2_1 = { topics: ['0x5678'] };
    const evt1_2 = { topics: ['0xabcd'] };

    test('Retrieves logs with topics matching requested event names', async () => {
      const safeLogsSpy = jest.spyOn(FilterLogs, 'safeGetBatchLogs').mockResolvedValue([evt1_1, evt1_1, evt2_1]);

      const result = await FilterLogs.getEvents('0xabcd', [iface1], ['Event1', 'Event2']);

      expect(result).toEqual([
        { v: `parsed_${evt1_1.topics[0]}`, rawLog: evt1_1 },
        { v: `parsed_${evt1_1.topics[0]}`, rawLog: evt1_1 },
        { v: `parsed_${evt2_1.topics[0]}`, rawLog: evt2_1 }
      ]);
      expect(safeLogsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0xabcd',
          topics: [expect.arrayContaining(['0x1234', '0x5678'])]
        }),
        expect.anything()
      );
      expect(iface1.parseLog).toHaveBeenCalledTimes(3);
      expect(iface1.parseLog).toHaveBeenNthCalledWith(1, evt1_1);
      expect(iface1.parseLog).toHaveBeenNthCalledWith(2, evt1_1);
      expect(iface1.parseLog).toHaveBeenNthCalledWith(3, evt2_1);
    });

    test('Supports multiple abis for the same event name', async () => {
      const safeLogsSpy = jest.spyOn(FilterLogs, 'safeGetBatchLogs').mockResolvedValue([evt1_1, evt1_2]);

      const result = await FilterLogs.getEvents('0xabcd', [iface1, iface2], ['Event1', 'Event2']);

      expect(result).toEqual([
        { v: `parsed_${evt1_1.topics[0]}`, rawLog: evt1_1 },
        { v: `parsed_${evt1_2.topics[0]}`, rawLog: evt1_2 }
      ]);
      expect(safeLogsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0xabcd',
          topics: [expect.arrayContaining(['0x1234', '0x5678', '0xabcd'])]
        }),
        expect.anything()
      );
      expect(iface1.parseLog).toHaveBeenCalledTimes(1);
      expect(iface1.parseLog).toHaveBeenCalledWith(evt1_1);
      expect(iface2.parseLog).toHaveBeenCalledTimes(1);
      expect(iface2.parseLog).toHaveBeenCalledWith(evt1_2);
    });
  });
});
