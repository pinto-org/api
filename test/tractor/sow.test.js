const { C } = require('../../src/constants/runtime-constants');
const SowExecutionDto = require('../../src/repository/dto/tractor/SowExecutionDto');
const SowOrderDto = require('../../src/repository/dto/tractor/SowOrderDto');
const PriceService = require('../../src/service/price-service');
const TractorSowService = require('../../src/service/tractor/blueprints/sow');

describe('TractorSowService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Creates additional order data for matching requisition', async () => {
    jest
      .spyOn(TractorSowService, 'decodeBlueprintData')
      .mockReturnValue({ version: 'V0', calldata: { args: { params: { opParams: { operatorTipAmount: 456n } } } } });
    jest.spyOn(SowOrderDto, 'fromBlueprintCalldata').mockReturnValue('dto');
    const upsertSpy = jest.spyOn(TractorSowService, 'updateOrders').mockImplementation(() => {});

    const result = await TractorSowService.tryAddRequisition({ blueprintHash: 123 }, 'data');

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
    const updateOrderSpy = jest.spyOn(TractorSowService, 'updateOrders').mockImplementation(() => {});
    jest.spyOn(SowExecutionDto, 'fromExecutionContext').mockImplementation(() => {});
    const updateExecutionSpy = jest.spyOn(TractorSowService, 'updateExecutions').mockImplementation(() => {});
    const priceSpy = jest.spyOn(PriceService, 'getBeanPrice').mockResolvedValue({ usdPrice: 1.5 });

    const result = await TractorSowService.orderExecuted(mockSowOrder, null, mockInnerEvents);

    expect(mockSowOrder.updateFieldsUponExecution).toHaveBeenCalledWith(mockInnerEvents);
    expect(updateOrderSpy).toHaveBeenCalledWith([mockSowOrder]);
    expect(updateExecutionSpy).toHaveBeenCalled();
    expect(priceSpy).toHaveBeenCalledWith({ blockNumber: 123456 });
    expect(result).toBeCloseTo(1.65, 5);
  });
});
