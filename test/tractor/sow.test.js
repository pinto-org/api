const { C } = require('../../src/constants/runtime-constants');
const SowV0ExecutionDto = require('../../src/repository/dto/tractor/SowV0ExecutionDto');
const SowV0OrderDto = require('../../src/repository/dto/tractor/SowV0OrderDto');
const PriceService = require('../../src/service/price-service');
const TractorSowV0Service = require('../../src/service/tractor/blueprints/sow-v0');

describe('TractorSowV0Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Creates additional order data for matching requisition', async () => {
    jest
      .spyOn(TractorSowV0Service, 'decodeBlueprintData')
      .mockReturnValue({ args: { params: { opParams: { operatorTipAmount: 456n } } } });
    jest.spyOn(SowV0OrderDto, 'fromBlueprintCalldata').mockReturnValue('dto');
    const upsertSpy = jest.spyOn(TractorSowV0Service, 'updateOrders').mockImplementation(() => {});

    const result = await TractorSowV0Service.tryAddRequisition({ blueprintHash: 123 }, 'data');

    expect(result).toBe(456n);
    expect(upsertSpy).toHaveBeenCalledWith(['dto']);
  });

  it('Creates matching execution data for order executed', async () => {
    const mockInnerEvents = [
      {
        name: 'OperatorReward',
        args: {
          token: C().BEAN,
          amount: '1100000'
        },
        rawLog: { blockNumber: 123456 }
      }
    ];
    const mockSowOrder = {
      updateFieldsUponExecution: jest.fn()
    };
    const updateOrderSpy = jest.spyOn(TractorSowV0Service, 'updateOrders').mockImplementation(() => {});
    jest.spyOn(SowV0ExecutionDto, 'fromExecutionContext').mockImplementation(() => {});
    const updateExecutionSpy = jest.spyOn(TractorSowV0Service, 'updateExecutions').mockImplementation(() => {});
    const priceSpy = jest.spyOn(PriceService, 'getBeanPrice').mockResolvedValue({ usdPrice: 1.5 });

    const result = await TractorSowV0Service.orderExecuted(mockSowOrder, null, mockInnerEvents);

    expect(mockSowOrder.updateFieldsUponExecution).toHaveBeenCalledWith(mockInnerEvents);
    expect(updateOrderSpy).toHaveBeenCalledWith([mockSowOrder]);
    expect(updateExecutionSpy).toHaveBeenCalled();
    expect(priceSpy).toHaveBeenCalledWith({ blockNumber: 123456 });
    expect(result).toBeCloseTo(1.65, 5);
  });
});
