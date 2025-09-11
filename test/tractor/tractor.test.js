const TractorConstants = require('../../src/constants/tractor');
const AlchemyUtil = require('../../src/datasources/alchemy');
const Contracts = require('../../src/datasources/contracts/contracts');
const FilterLogs = require('../../src/datasources/events/filter-logs');
const TractorExecutionDto = require('../../src/repository/dto/tractor/TractorExecutionDto');
const TractorOrderDto = require('../../src/repository/dto/tractor/TractorOrderDto');
const TractorTask = require('../../src/scheduled/tasks/tractor');
const TaskRangeUtil = require('../../src/scheduled/util/task-range');
const AppMetaService = require('../../src/service/meta-service');
const PriceService = require('../../src/service/price-service');
const TractorSowV0Service = require('../../src/service/tractor/blueprints/sow-v0');
const SnapshotSowV0Service = require('../../src/service/tractor/snapshot-sow-v0-service');
const TractorService = require('../../src/service/tractor/tractor-service');

describe('TractorTask', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Does nothing if uninitialized', async () => {
    jest.spyOn(AppMetaService, 'getTractorMeta').mockResolvedValue({
      lastUpdate: 10
    });
    jest.spyOn(SnapshotSowV0Service, 'nextSnapshotBlock').mockResolvedValue(4000);
    jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({ isInitialized: false });
    const filterLogSpy = jest.spyOn(FilterLogs, 'getBeanstalkEvents');

    const retval = await TractorTask.update();

    expect(retval).toBe(false);
    expect(filterLogSpy).not.toHaveBeenCalled();
  });

  describe('Initialized', () => {
    beforeEach(() => {
      jest.spyOn(AppMetaService, 'getTractorMeta').mockResolvedValue({
        lastUpdate: 10
      });
      jest.spyOn(SnapshotSowV0Service, 'nextSnapshotBlock').mockResolvedValue(4000);
      jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
        isInitialized: true,
        lastUpdate: 2000,
        updateBlock: 4000,
        isCaughtUp: false,
        meta: null
      });
      jest.spyOn(FilterLogs, 'getBeanstalkEvents').mockResolvedValue([
        { name: 'PublishRequisition', value: 1 },
        { name: 'CancelBlueprint', value: 2 },
        { name: 'Tractor', value: 3 },
        { name: 'Tractor', value: 4 }
      ]);
      jest.spyOn(SnapshotSowV0Service, 'takeSnapshot').mockImplementation(() => {});
    });

    test('Passes events to correct handlers', async () => {
      jest.spyOn(TractorConstants, 'knownBlueprints').mockReturnValue({});
      const requisitionSpy = jest.spyOn(TractorTask, 'handlePublishRequsition').mockImplementation(() => {});
      const cancelSpy = jest.spyOn(TractorTask, 'handleCancelBlueprint').mockImplementation(() => {});
      const tractorSpy = jest.spyOn(TractorTask, 'handleTractor').mockImplementation(() => {});
      const metaSpy = jest.spyOn(AppMetaService, 'setLastTractorUpdate').mockImplementation(() => {});

      const retval = await TractorTask.update();

      expect(retval).toBe(true);
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
      jest.spyOn(TractorTask, 'handlePublishRequsition').mockImplementation(() => {});
      jest.spyOn(TractorTask, 'handleCancelBlueprint').mockImplementation(() => {});
      jest.spyOn(TractorTask, 'handleTractor').mockImplementation(() => {});
      jest.spyOn(AppMetaService, 'setLastTractorUpdate').mockImplementation(() => {});

      await TractorTask.update();

      expect(blueprintSpy.periodicUpdate).toHaveBeenCalledWith(expect.any(Function), 4000);
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
      const sowExeSpy = jest.spyOn(TractorSowV0Service, 'orderExecuted').mockResolvedValue(1.25);
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
