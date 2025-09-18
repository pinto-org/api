const ConvertUpV0OrderDto = require('../../src/repository/dto/tractor/ConvertUpV0OrderDto');
const TractorConvertUpV0Service = require('../../src/service/tractor/blueprints/convert-up-v0');

describe('TractorConvertUpV0Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Creates additional order data for matching requisition', async () => {
    jest
      .spyOn(TractorConvertUpV0Service, 'decodeBlueprintData')
      .mockReturnValue({ args: { params: { opParams: { operatorTipAmount: 456n } } } });
    jest.spyOn(ConvertUpV0OrderDto, 'fromBlueprintCalldata').mockReturnValue('dto');
    const upsertSpy = jest.spyOn(TractorConvertUpV0Service, 'updateOrders').mockImplementation(() => {});

    const result = await TractorConvertUpV0Service.tryAddRequisition({ blueprintHash: 123 }, 'data');

    expect(result).toBe(456n);
    expect(upsertSpy).toHaveBeenCalledWith(['dto']);
  });
});
