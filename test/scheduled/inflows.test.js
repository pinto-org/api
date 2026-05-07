const EventsUtils = require('../../src/datasources/events/util');
const FilterLogs = require('../../src/datasources/events/filter-logs');
const SiloEvents = require('../../src/datasources/events/silo-events');
const SiloInflowService = require('../../src/service/inflow/silo-inflow-service');
const SiloInflowSnapshotService = require('../../src/service/inflow/silo-inflow-snapshot-service');
const FieldInflowService = require('../../src/service/inflow/field-inflow-service');
const FieldInflowSnapshotService = require('../../src/service/inflow/field-inflow-snapshot-service');
const AppMetaService = require('../../src/service/meta-service');
const PriceService = require('../../src/service/price-service');
const InflowsTask = require('../../src/scheduled/tasks/inflows');
const TaskRangeUtil = require('../../src/scheduled/util/task-range');
const FieldInflowsUtil = require('../../src/scheduled/util/field-inflows');
const SiloInflowsUtil = require('../../src/scheduled/util/silo-inflows');
const AsyncContext = require('../../src/utils/async/context');
const { C } = require('../../src/constants/runtime-constants');

describe('InflowsTask', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Memoizes block-scoped price reads during an update run', async () => {
    const events = [
      {
        name: 'Sow',
        args: { account: '0xaaa', pods: '1000000' },
        rawLog: { logIndex: 1, blockNumber: 1000, transactionHash: '0xtx1' },
        extra: { timestamp: 1 }
      },
      {
        name: 'ClaimPlenty',
        args: { account: '0xaaa', token: C().WETH, plenty: '1000' },
        rawLog: { logIndex: 2, blockNumber: 1000, transactionHash: '0xtx1' },
        extra: { timestamp: 1 }
      },
      {
        name: 'Sow',
        args: { account: '0xbbb', pods: '2000000' },
        rawLog: { logIndex: 3, blockNumber: 1000, transactionHash: '0xtx2' },
        extra: { timestamp: 1 }
      },
      {
        name: 'ClaimPlenty',
        args: { account: '0xbbb', token: C().WETH, plenty: '2000' },
        rawLog: { logIndex: 4, blockNumber: 1000, transactionHash: '0xtx2' },
        extra: { timestamp: 1 }
      }
    ];

    jest.spyOn(AppMetaService, 'getInflowMeta').mockResolvedValue({});
    jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
      isInitialized: true,
      lastUpdate: 999,
      updateBlock: 1000,
      isCaughtUp: true
    });
    jest.spyOn(FilterLogs, 'getBeanstalkEvents').mockResolvedValue(events);
    jest.spyOn(EventsUtils, 'attachTimestamps').mockResolvedValue();
    jest.spyOn(EventsUtils, 'groupByTransaction').mockResolvedValue({
      '0xtx1': [events[0], events[1]],
      '0xtx2': [events[2], events[3]]
    });
    jest.spyOn(SiloEvents, 'removeConvertRelatedEvents').mockImplementation(() => {});
    jest.spyOn(SiloEvents, 'removePlantRelatedEvents').mockImplementation(() => {});
    const beanPriceSpy = jest.spyOn(PriceService, 'getBeanPrice').mockResolvedValue({ usdPrice: 1 });
    const temperatureSpy = jest.spyOn(FieldInflowsUtil, 'getTemperatureForBlock').mockResolvedValue(0n);
    const tokenPriceSpy = jest.spyOn(PriceService, 'getTokenPrice').mockResolvedValue({ usdPrice: 1 });
    jest.spyOn(SiloInflowsUtil, 'netDeposits').mockReturnValue({});
    jest.spyOn(SiloInflowsUtil, 'netBdvInflows').mockReturnValue({});
    jest.spyOn(FieldInflowsUtil, 'netBdvInflows').mockReturnValue({});
    jest.spyOn(SiloInflowsUtil, 'inflowsFromNetDeposits').mockResolvedValue([]);
    jest.spyOn(SiloInflowsUtil, 'inflowsFromClaimPlenties').mockReturnValue([]);
    jest.spyOn(FieldInflowsUtil, 'inflowsFromFieldEvents').mockReturnValue([]);
    jest.spyOn(AsyncContext, 'sequelizeTransaction').mockImplementation((cb) => cb());
    jest.spyOn(SiloInflowService, 'insertInflows').mockResolvedValue();
    jest.spyOn(FieldInflowService, 'insertInflows').mockResolvedValue();
    jest.spyOn(SiloInflowSnapshotService, 'takeMissingSnapshots').mockResolvedValue();
    jest.spyOn(FieldInflowSnapshotService, 'takeMissingSnapshots').mockResolvedValue();
    jest.spyOn(AppMetaService, 'setLastInflowUpdate').mockResolvedValue();

    await InflowsTask.update();

    expect(beanPriceSpy).toHaveBeenCalledTimes(1);
    expect(temperatureSpy).toHaveBeenCalledTimes(1);
    expect(tokenPriceSpy).toHaveBeenCalledTimes(1);
  });
});
