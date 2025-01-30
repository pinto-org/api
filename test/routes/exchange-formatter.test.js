const ExchangeResponseFormatter = require('../../src/service/utils/exchange/response-formatter');

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

    const formatted = ExchangeResponseFormatter.formatTickersCG(input);

    expect(formatted).toEqual(output);
  });
});
