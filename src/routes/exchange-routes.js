const Router = require('koa-router');
const RestParsingUtil = require('../utils/rest-parsing');
const InputError = require('../error/input-error');
const ExchangeService = require('../service/exchange-service');
const ExchangeResponseFormatter = require('../service/utils/exchange/response-formatter');

const router = new Router({
  prefix: '/exchange'
});

router.get('/cg/tickers', async (ctx) => {
  await tickers(ctx, ExchangeResponseFormatter.formatTickersCG);
});
router.get('/cmc/tickers', async (ctx) => {
  await tickers(ctx, ExchangeResponseFormatter.formatTickersCMC);
});

router.get('/cg/historical_trades', historicalTrades);
router.get('/cmc/historical_trades', historicalTrades);

/**
 * Gets past 24h stats on dex tickers.
 * ?blockNumber: defaults to lastest block.
 * ?timestamp: used when blockNumber is not provided. using blockNumber is more performant.
 */
async function tickers(ctx, formatter) {
  const options = RestParsingUtil.parseQuery(ctx.query);
  const tickers = await ExchangeService.getTickers(options);
  ctx.body = formatter(tickers);
}

/**
 * Gets dex historical trades.
 * ?ticker_id (required): unique id of the ticker. `${token1}_${token2}`
 * ?type: 'buy' | 'sell'
 * ?limit: limit to number of results (default 500).
 * ?start_time: lower bound trade time. Defaults to end_time minus 7 days.
 * ?end_time: upper bound trade time. Defaults to the current time.
 */
async function historicalTrades(ctx) {
  const options = RestParsingUtil.parseQuery(ctx.query);
  if (!options.ticker_id) {
    throw new InputError('Required parameter not provided');
  }

  // Defaults for optional variables
  options.limit = options.limit ?? 500;
  options.end_time = Math.floor((options.end_time ?? new Date()).getTime() / 1000);
  options.start_time = Math.floor(
    (options.start_time?.getTime() ?? options.end_time * 1000 - 7 * 24 * 60 * 60 * 1000) / 1000
  );

  const trades = await ExchangeService.getTrades(options);
  ctx.body = trades;
}

module.exports = router;
