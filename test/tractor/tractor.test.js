const TractorConstants = require('../../src/constants/tractor');
const AlchemyUtil = require('../../src/datasources/alchemy');
const Contracts = require('../../src/datasources/contracts/contracts');
const SiloEvents = require('../../src/datasources/events/silo-events');
const FilterLogs = require('../../src/datasources/events/filter-logs');
const TractorExecutionDto = require('../../src/repository/dto/tractor/TractorExecutionDto');
const TractorOrderDto = require('../../src/repository/dto/tractor/TractorOrderDto');
const TractorTask = require('../../src/scheduled/tasks/tractor');
const TaskRangeUtil = require('../../src/scheduled/util/task-range');
const AppMetaService = require('../../src/service/meta-service');
const PriceService = require('../../src/service/price-service');
const TractorSowService = require('../../src/service/tractor/blueprints/sow');
const SnapshotSowService = require('../../src/service/tractor/snapshots/snapshot-sow-service');
const TractorService = require('../../src/service/tractor/tractor-service');

describe('TractorTask', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Does nothing if uninitialized', async () => {
    jest.spyOn(AppMetaService, 'getTractorMeta').mockResolvedValue({
      lastUpdate: null
    });
    const filterLogSpy = jest.spyOn(FilterLogs, 'getBeanstalkEvents');
    const snapshotSpy = jest.spyOn(SnapshotSowService, 'nextSnapshotBlock');
    const taskRangeSpy = jest.spyOn(TaskRangeUtil, 'getUpdateInfo');

    const retval = await TractorTask.update();

    expect(retval).toBe(false);
    expect(filterLogSpy).not.toHaveBeenCalled();
    expect(snapshotSpy).not.toHaveBeenCalled();
    expect(taskRangeSpy).not.toHaveBeenCalled();
  });

  describe('Initialized', () => {
    let requisitionSpy;
    let cancelSpy;
    let tractorSpy;
    let metaSpy;

    beforeEach(() => {
      jest.spyOn(AppMetaService, 'getTractorMeta').mockResolvedValue({
        lastUpdate: 10
      });
      jest.spyOn(SnapshotSowService, 'nextSnapshotBlock').mockReturnValue(4000);
      jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
        isInitialized: true,
        lastUpdate: 2000,
        updateBlock: 4000,
        isCaughtUp: false,
        meta: null
      });
      jest
        .spyOn(FilterLogs, 'getBeanstalkEvents')
        .mockResolvedValueOnce([{ name: 'Sunrise', rawLog: { blockNumber: 1000 } }])
        .mockResolvedValueOnce([
          { name: 'PublishRequisition', value: 1 },
          { name: 'CancelBlueprint', value: 2 },
          { name: 'Tractor', value: 3 },
          { name: 'Tractor', value: 4 }
        ]);
      jest.spyOn(SiloEvents, 'getSiloDepositEvents').mockResolvedValue([{ account: '0xabcd' }]);
      jest.spyOn(SnapshotSowService, 'takeSnapshot').mockImplementation(() => {});
      requisitionSpy = jest.spyOn(TractorTask, 'handlePublishRequsition').mockImplementation(() => {});
      cancelSpy = jest.spyOn(TractorTask, 'handleCancelBlueprint').mockImplementation(() => {});
      tractorSpy = jest.spyOn(TractorTask, 'handleTractor').mockImplementation(() => {});
      metaSpy = jest.spyOn(AppMetaService, 'setLastTractorUpdate').mockImplementation(() => {});
    });

    test('Passes events to correct handlers', async () => {
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({});

      const retval = await TractorTask.update();

      expect(retval).toBe(5);
      expect(requisitionSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 1 }));
      expect(cancelSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 2 }));
      expect(tractorSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 3 }));
      expect(tractorSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 4 }));
      expect(metaSpy).toHaveBeenCalledWith(4000);
    });

    test('Invokes periodic update on each blueprint', async () => {
      const blueprintSpy = {
        periodicUpdate: jest.fn().mockImplementation(() => {})
      };
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({ a: blueprintSpy });

      await TractorTask.update();

      expect(TractorTask.isCaughtUp()).toBe(false);
      expect(blueprintSpy.periodicUpdate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        4000,
        new Set(['0xabcd']),
        false
      );
    });

    test('Periodic update is forceful when coincides with the sunrise block', async () => {
      jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
        isInitialized: true,
        lastUpdate: 500,
        updateBlock: 1000,
        isCaughtUp: false,
        meta: null
      });
      jest.spyOn(SiloEvents, 'getSiloDepositEvents').mockResolvedValue([{ account: '0xabcd' }]);
      const blueprintSpy = {
        periodicUpdate: jest.fn().mockImplementation(() => {})
      };
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({ a: blueprintSpy });

      await TractorTask.update();

      expect(blueprintSpy.periodicUpdate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        1000,
        new Set(['0xabcd']),
        true
      );
    });

    test('Task can catch up', async () => {
      jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
        isInitialized: true,
        lastUpdate: 500,
        updateBlock: 1000,
        isCaughtUp: true,
        meta: null
      });
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({});

      await TractorTask.update();

      expect(TractorTask.isCaughtUp()).toBe(true);
    });
  });

  describe('PublishRequisition', () => {
    test('Unknown blueprint requisition', async () => {
      const event = {
        args: { requisition: { blueprint: { data: 123 } } }
      };
      jest.spyOn(TractorOrderDto, 'fromRequisitionEvt').mockResolvedValue('dto');
      const upsertSpy = jest.spyOn(TractorService, 'updateOrders').mockResolvedValue(['model']);
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({});

      await TractorTask.handlePublishRequsition(event);

      expect(upsertSpy).toHaveBeenCalledTimes(1);
      expect(upsertSpy).toHaveBeenCalledWith(['dto']);
    });

    test('Known blueprint requisition', async () => {
      const event = {
        args: { requisition: { blueprint: { data: 'blueprintData' } } }
      };
      let capturedArgs;
      const blueprintSpy = {
        orderType: 'testOrder',
        tryAddRequisition: jest.fn().mockImplementation((...args) => {
          capturedArgs = JSON.parse(JSON.stringify(args));
          return 5n;
        })
      };
      jest.spyOn(TractorOrderDto, 'fromRequisitionEvt').mockResolvedValue('dto');
      const upsertSpy = jest.spyOn(TractorService, 'updateOrders').mockResolvedValue([{ model: true }]);
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({ a: blueprintSpy });

      await TractorTask.handlePublishRequsition(event);

      expect(capturedArgs).toEqual([{ model: true }, 'blueprintData']);
      expect(upsertSpy).toHaveBeenCalledTimes(2);
      expect(upsertSpy).toHaveBeenCalledWith(['dto']);
      expect(upsertSpy).toHaveBeenCalledWith([{ model: true, orderType: 'testOrder', beanTip: 5n }]);
    });
  });

  describe('Tractor', () => {
    const events = [
      { name: 'TractorExecutionBegan', args: { gasleft: 5000, blueprintHash: 123, nonce: 5 }, rawLog: { index: 0 } },
      { name: 'Sow', rawLog: { index: 5 } },
      { name: 'Tractor', args: { gasleft: 4750, blueprintHash: 123, nonce: 5 }, rawLog: { index: 100 } }
    ];
    let executionDtoSpy;
    let executionDbSpy;
    let constSpy;

    beforeEach(() => {
      jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
        getTransactionReceipt: jest.fn().mockResolvedValue('receipt')
      });
      jest.spyOn(Contracts, 'get').mockImplementation(() => {});
      jest.spyOn(FilterLogs, 'getTransactionEvents').mockResolvedValue(events);
      jest.spyOn(PriceService, 'getTokenPrice').mockResolvedValue({ usdPrice: 1500 });

      executionDtoSpy = jest.spyOn(TractorExecutionDto, 'fromTractorEvtContext').mockResolvedValue('dto');
      constSpy = jest.spyOn(TractorConstants, 'knownBlueprints');
    });

    test('Unknown blueprint', async () => {
      jest.spyOn(TractorService, 'getOrders').mockResolvedValue({ orders: [{ orderType: null }] });
      executionDbSpy = jest.spyOn(TractorService, 'updateExecutions').mockResolvedValueOnce(['inserted']);

      await TractorTask.handleTractor(events[2]);

      expect(executionDtoSpy).toHaveBeenCalledWith({
        tractorEvent: events[2],
        receipt: 'receipt',
        gasUsed: 120250,
        ethPriceUsd: 1500
      });
      expect(executionDbSpy).toHaveBeenCalledWith(['dto']);
      expect(constSpy).not.toHaveBeenCalled();
    });

    test('Known blueprint', async () => {
      jest
        .spyOn(TractorService, 'getOrders')
        .mockResolvedValue({ orders: [{ orderType: 'SOW_V0', blueprintData: 'blueprintData' }] });
      const sowExeSpy = jest.spyOn(TractorSowService, 'orderExecuted').mockResolvedValue(1.25);
      const insertedDto = {};
      executionDbSpy = jest
        .spyOn(TractorService, 'updateExecutions')
        .mockResolvedValueOnce([insertedDto])
        .mockResolvedValueOnce(['updated']);

      await TractorTask.handleTractor(events[2]);

      expect(executionDtoSpy).toHaveBeenCalledWith({
        tractorEvent: events[2],
        receipt: 'receipt',
        gasUsed: 120250,
        ethPriceUsd: 1500
      });
      expect(executionDbSpy).toHaveBeenCalledWith(['dto']);
      expect(constSpy).toHaveBeenCalled();
      expect(sowExeSpy).toHaveBeenCalledWith(expect.anything(), insertedDto, [events[1]]);
      expect(executionDbSpy).toHaveBeenNthCalledWith(2, [insertedDto]);
      expect(insertedDto.tipUsd).toBe(1.25);
    });
  });
});
