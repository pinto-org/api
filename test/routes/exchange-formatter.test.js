const ExchangeResponseFormatter = require('../../src/service/utils/exchange/response-formatter');
const { mockPintoERC20s, mockPintoConstants } = require('../util/mock-constants');

describe('ExchangeResponseFormatter', () => {
  test('Formats Coingecko Tickers', () => {
    const input = require('../mock-responses/routes/exchangeTickers.json');
    const output = require('../mock-responses/routes/expectedTickersCG.json');

    const formatted = ExchangeResponseFormatter.formatTickersCG(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap Summary', () => {
    const input = require('../mock-responses/routes/exchangeTickers.json');
    const output = require('../mock-responses/routes/expectedSummaryCMC.json');

    const formatted = ExchangeResponseFormatter.formatSummaryCMC(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coingecko Trades', () => {
    const input = require('../mock-responses/routes/exchangeTrades.json');
    const output = require('../mock-responses/routes/expectedTradesCG.json');

    const formatted = ExchangeResponseFormatter.formatTradesCG(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap Trades', () => {
    const input = require('../mock-responses/routes/exchangeTrades.json');
    const output = require('../mock-responses/routes/expectedTradesCMC.json');

    const formatted = ExchangeResponseFormatter.formatTradesCMC(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap Tickers', () => {
    const input = require('../mock-responses/routes/exchangeTickers.json');
    const output = require('../mock-responses/routes/expectedTickersCMC.json');

    const formatted = ExchangeResponseFormatter.formatTickersCMC(input);

    expect(formatted).toEqual(output);
  });

  test('Formats Coinmarketcap Yields', async () => {
    mockPintoConstants();
    mockPintoERC20s();
    const input = require('../mock-responses/routes/exchangeYields.json');
    const output = require('../mock-responses/routes/expectedYieldsCMC.json');

    const formatted = await ExchangeResponseFormatter.formatYieldsCMC(input);

    expect(formatted).toEqual(output);
  });
});
