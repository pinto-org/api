const ConvertUpOrderDto = require('../../src/repository/dto/tractor/ConvertUpOrderDto');
const TractorConvertUpService = require('../../src/service/tractor/blueprints/convert-up');

describe('TractorConvertUpService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Creates additional order data for matching requisition', async () => {
    jest
      .spyOn(TractorConvertUpService, 'decodeBlueprintData')
      .mockReturnValue({ version: 'V0', calldata: { args: { params: { opParams: { operatorTipAmount: 456n } } } } });
    jest.spyOn(ConvertUpOrderDto, 'fromBlueprintCalldata').mockReturnValue('dto');
    const upsertSpy = jest.spyOn(TractorConvertUpService, 'updateOrders').mockImplementation(() => {});

    const result = await TractorConvertUpService.tryAddRequisition({ blueprintHash: 123 }, 'data');

    expect(result).toBe(456n);
    expect(upsertSpy).toHaveBeenCalledWith(['dto']);
  });
});
