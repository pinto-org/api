const FilterLogs = require('../../src/datasources/events/filter-logs');
const TractorOrderDto = require('../../src/repository/dto/tractor/TractorOrderDto');
const TractorTask = require('../../src/scheduled/tasks/tractor');
const TaskRangeUtil = require('../../src/scheduled/util/task-range');
const AppMetaService = require('../../src/service/meta-service');
const TractorService = require('../../src/service/tractor-service');

describe('TractorTask', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Does nothing if uninitialized', async () => {
    jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({ isInitialized: false });
    const filterLogSpy = jest.spyOn(FilterLogs, 'getBeanstalkEvents');

    const retval = await TractorTask.updateTractor();

    expect(retval).not.toBeDefined();
    expect(filterLogSpy).not.toHaveBeenCalled();
  });

  describe('Initialized', () => {
    beforeEach(() => {
      jest.spyOn(TaskRangeUtil, 'getUpdateInfo').mockResolvedValue({
        isInitialized: true,
        lastUpdate: 2000,
        updateBlock: 4000,
        isCaughtUp: false,
        meta: null
      });
      jest.spyOn(FilterLogs, 'getBeanstalkEvents').mockResolvedValue([
        { name: 'PublishRequisition', value: 1 },
        { name: 'Tractor', value: 2 },
        { name: 'Tractor', value: 3 }
      ]);
    });

    test('Passes events to correct handlers', async () => {
      jest.spyOn(TractorTask, 'knownBlueprints').mockReturnValue([]);
      const requisitionSpy = jest.spyOn(TractorTask, 'handlePublishRequsition').mockImplementation(() => {});
      const tractorSpy = jest.spyOn(TractorTask, 'handleTractor').mockImplementation(() => {});
      const metaSpy = jest.spyOn(AppMetaService, 'setLastTractorUpdate').mockImplementation(() => {});

      const retval = await TractorTask.updateTractor();

      expect(retval).toBe(false);
      expect(requisitionSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 1 }));
      expect(tractorSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 2 }));
      expect(tractorSpy).toHaveBeenCalledWith(expect.objectContaining({ value: 3 }));
      expect(metaSpy).toHaveBeenCalledWith(4000);
    });

    test('Invokes periodic update on each blueprint', async () => {
      const blueprintSpy = {
        periodicUpdate: jest.fn().mockImplementation(() => {})
      };
      jest.spyOn(TractorTask, 'knownBlueprints').mockReturnValue([blueprintSpy]);
      jest.spyOn(TractorTask, 'handlePublishRequsition').mockImplementation(() => {});
      jest.spyOn(TractorTask, 'handleTractor').mockImplementation(() => {});
      jest.spyOn(AppMetaService, 'setLastTractorUpdate').mockImplementation(() => {});

      await TractorTask.updateTractor();

      expect(blueprintSpy.periodicUpdate).toHaveBeenCalledWith(2001, 4000);
    });
  });

  describe('PublishRequisition', () => {
    test('Unknown blueprint requisition', async () => {
      const event = {
        args: { requisition: { blueprint: { data: 123 } } }
      };
      jest.spyOn(TractorOrderDto, 'fromRequisitionEvt').mockResolvedValue('dto');
      const upsertSpy = jest.spyOn(TractorService, 'updateOrders').mockResolvedValue(['model']);
      jest.spyOn(TractorTask, 'knownBlueprints').mockReturnValue([]);

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
      jest.spyOn(TractorTask, 'knownBlueprints').mockReturnValue([blueprintSpy]);

      await TractorTask.handlePublishRequsition(event);

      expect(capturedArgs).toEqual([{ model: true }, 'blueprintData']);
      expect(upsertSpy).toHaveBeenCalledTimes(2);
      expect(upsertSpy).toHaveBeenCalledWith(['dto']);
      expect(upsertSpy).toHaveBeenCalledWith([{ model: true, orderType: 'testOrder', beanTip: 5n }]);
    });
  });
});
