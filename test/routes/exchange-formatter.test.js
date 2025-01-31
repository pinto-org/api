const ExchangeResponseFormatter = require('../../src/service/utils/exchange/response-formatter');
const { mockPintoERC20s, mockPintoConstants } = require('../util/mock-constants');

describe('ExchangeResponseFormatter', () => {
  test('Formats Coingecko', () => {
    const input = require('../mock-responses/routes/exchangeTickers.json');
    const output = require('../mock-responses/routes/expectedTickersCG.json');

    const formatted = ExchangeResponseFormatter.formatTickersCG(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap', () => {
    const input = require('../mock-responses/routes/exchangeTickers.json');
    const output = require('../mock-responses/routes/expectedTickersCMC.json');

    const formatted = ExchangeResponseFormatter.formatTickersCMC(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap yields', async () => {
    mockPintoConstants();
    mockPintoERC20s();
    const input = require('../mock-responses/routes/exchangeYields.json');
    const output = require('../mock-responses/routes/expectedYieldsCMC.json');

    const formatted = await ExchangeResponseFormatter.formatYieldsCMC(input);

    expect(formatted).toEqual(output);
  });
});
