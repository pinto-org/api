const WebsocketTaskTrigger = require('../../src/scheduled/websocket');
const Beanstalk = require('../../src/datasources/contracts/upgradeable/beanstalk');
const SeasonService = require('../../src/service/season-service');
const DepositsTask = require('../../src/scheduled/tasks/deposits');
const InflowsTask = require('../../src/scheduled/tasks/inflows');
const TractorTask = require('../../src/scheduled/tasks/tractor');
const { sendWebhookMessage } = require('../../src/utils/discord');
const { mockBeanstalkConstants } = require('../util/mock-constants');

describe('WebsocketTaskTrigger', () => {
  let mockWS;
  let mockConstants;
  let registeredCallback;
  let mockInterfaces;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockBeanstalkConstants();

    // Create mock interfaces for parsing logs
    mockInterfaces = createMockInterfaces();

    // Mock Beanstalk.getAllInterfaces
    jest.spyOn(Beanstalk, 'getAllInterfaces').mockReturnValue(mockInterfaces);

    // Mock the websocket object and capture the callback
    mockWS = {
      on: jest.fn((filter, callback) => {
        registeredCallback = callback;
      })
    };

    // Create mock constants object with mocked WS
    mockConstants = {
      BEANSTALK: '0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5',
      CHAIN: 'eth',
      WS: mockWS
    };

    // Mock task methods
    jest.spyOn(DepositsTask, 'isCaughtUp').mockReturnValue(true);
    jest.spyOn(DepositsTask, 'handleLiveEvent').mockImplementation(() => {});
    jest.spyOn(InflowsTask, 'isCaughtUp').mockReturnValue(true);
    jest.spyOn(InflowsTask, 'handleLiveEvent').mockImplementation(() => {});
    jest.spyOn(TractorTask, 'isCaughtUp').mockReturnValue(true);
    jest.spyOn(TractorTask, 'handleLiveEvent').mockImplementation(() => {});

    // Mock SeasonService
    jest.spyOn(SeasonService, 'handleSunrise').mockImplementation(() => {});
  });

  test('Registers websocket listener with correct filter', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    expect(mockWS.on).toHaveBeenCalledTimes(1);
    const [filter, callback] = mockWS.on.mock.calls[0];

    expect(filter.address).toEqual([mockConstants.BEANSTALK]);
    expect(filter.topics).toEqual([expect.arrayContaining(['sunrise_topic', 'adddeposit_topic', 'tractor_topic'])]);
    expect(callback).toBeDefined();
  });

  test('Parses and handles Sunrise event', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    const mockLog = createMockLog('Sunrise', 'sunrise_topic', {
      season: 12345n,
      transactionHash: '0xabc123',
      blockNumber: 1000
    });

    await registeredCallback(mockLog);

    expect(SeasonService.handleSunrise).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sunrise',
        args: expect.objectContaining({ season: 12345n }),
        rawLog: mockLog
      })
    );
    expect(DepositsTask.handleLiveEvent).toHaveBeenCalled();
    expect(InflowsTask.handleLiveEvent).toHaveBeenCalled();
    expect(TractorTask.handleLiveEvent).toHaveBeenCalled();
  });

  test('Handles AddDeposit event and notifies correct tasks', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    const mockLog = createMockLog('AddDeposit', 'adddeposit_topic', {
      account: '0x123',
      token: '0xabc',
      amount: 1000n,
      transactionHash: '0xdef456',
      blockNumber: 2000
    });

    await registeredCallback(mockLog);

    expect(DepositsTask.handleLiveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'AddDeposit',
        args: expect.objectContaining({ account: '0x123', amount: 1000n })
      })
    );
    expect(InflowsTask.handleLiveEvent).toHaveBeenCalled();
    expect(TractorTask.handleLiveEvent).toHaveBeenCalled();
    expect(SeasonService.handleSunrise).not.toHaveBeenCalled();
  });

  test('Handles PublishRequisition event and notifies only TractorTask', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    const mockLog = createMockLog('PublishRequisition', 'tractor_topic', {
      publisher: '0x789',
      requisitionId: '0xreq123',
      transactionHash: '0xghi789',
      blockNumber: 3000
    });

    await registeredCallback(mockLog);

    expect(TractorTask.handleLiveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PublishRequisition',
        args: expect.objectContaining({ publisher: '0x789' })
      })
    );
    expect(DepositsTask.handleLiveEvent).not.toHaveBeenCalled();
    expect(InflowsTask.handleLiveEvent).not.toHaveBeenCalled();
  });

  test('Does not notify tasks that are not caught up', async () => {
    // Set some tasks as not caught up
    DepositsTask.isCaughtUp.mockReturnValue(false);
    TractorTask.isCaughtUp.mockReturnValue(false);

    await WebsocketTaskTrigger.listen(mockConstants);

    const mockLog = createMockLog('Sunrise', 'sunrise_topic', {
      season: 12345n,
      transactionHash: '0xabc123',
      blockNumber: 1000
    });

    await registeredCallback(mockLog);

    // Only InflowsTask is caught up and should be notified
    expect(InflowsTask.handleLiveEvent).toHaveBeenCalled();
    expect(DepositsTask.handleLiveEvent).not.toHaveBeenCalled();
    expect(TractorTask.handleLiveEvent).not.toHaveBeenCalled();
  });

  test('Handles multiple events in sequence', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    const logs = [
      createMockLog('Sunrise', 'sunrise_topic', {
        season: 100n,
        transactionHash: '0xtx1',
        blockNumber: 1000
      }),
      createMockLog('AddDeposit', 'adddeposit_topic', {
        account: '0x111',
        token: '0xaaa',
        amount: 100n,
        transactionHash: '0xtx2',
        blockNumber: 1000
      }),
      createMockLog('Sow', 'sow_topic', {
        account: '0x222',
        beans: 500n,
        pods: 550n,
        transactionHash: '0xtx3',
        blockNumber: 1000
      })
    ];

    for (const log of logs) {
      await registeredCallback(log);
    }

    expect(SeasonService.handleSunrise).toHaveBeenCalledTimes(1);
    expect(DepositsTask.handleLiveEvent).toHaveBeenCalledTimes(2); // Sunrise + AddDeposit
    expect(InflowsTask.handleLiveEvent).toHaveBeenCalledTimes(3); // All three events
    expect(TractorTask.handleLiveEvent).toHaveBeenCalledTimes(2); // Sunrise + AddDeposit
  });

  test('Attaches rawLog to parsed event', async () => {
    await WebsocketTaskTrigger.listen(mockConstants);

    const mockLog = createMockLog('AddDeposit', 'adddeposit_topic', {
      account: '0x123',
      token: '0xabc',
      amount: 1000n,
      transactionHash: '0xyz567',
      blockNumber: 9000
    });

    await registeredCallback(mockLog);

    expect(DepositsTask.handleLiveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        rawLog: mockLog
      })
    );
  });
});

// Helper functions

function createMockInterfaces() {
  const eventTopics = {
    Sunrise: 'sunrise_topic',
    PublishRequisition: 'tractor_topic',
    CancelBlueprint: 'cancelblueprint_topic',
    Tractor: 'tractor_topic',
    AddDeposit: 'adddeposit_topic',
    RemoveDeposit: 'removedeposit_topic',
    RemoveDeposits: 'removedeposits_topic',
    StalkBalanceChanged: 'stalkbalancechanged_topic',
    Sow: 'sow_topic',
    Harvest: 'harvest_topic',
    PodListingFilled: 'podlistingfilled_topic',
    PodOrderFilled: 'podorderfilled_topic',
    Plant: 'plant_topic',
    Convert: 'convert_topic',
    ClaimPlenty: 'claimplenty_topic'
  };

  return [
    {
      getEventTopic: jest.fn((eventName) => eventTopics[eventName]),
      parseLog: jest.fn((log) => {
        // Find the event name from the topic
        const eventName = Object.keys(eventTopics).find((name) => eventTopics[name] === log.topics[0]);
        return {
          name: eventName,
          args: log.args || {},
          rawLog: undefined // Will be set by the websocket handler
        };
      })
    }
  ];
}

function createMockLog(eventName, topicHash, data) {
  return {
    topics: [topicHash],
    args: data,
    name: eventName,
    transactionHash: data.transactionHash,
    blockNumber: data.blockNumber,
    removed: false
  };
}
