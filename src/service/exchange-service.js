const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const BasinSubgraphRepository = require('../repository/subgraph/basin-subgraph');
const PromiseUtil = require('../utils/async/promise');
const LiquidityUtil = require('./utils/pool/liquidity');
const { C } = require('../constants/runtime-constants');
const ERC20Info = require('../datasources/erc20-info');

const ONE_DAY = 60 * 60 * 24;

class ExchangeService {
  static async getTickers(options = {}) {
    // Determine block
    const block = await BlockUtil.blockForSubgraphFromOptions(C().SG.BASIN, options);

    // Retrieve all results upfront from Basin subgraph.
    // This strategy is optimized for performance/minimal load against subgraph api rate limits.

    // Trades are only needed to produce the high/low over the period, in the future can improve
    // performance by sourcing this information elsewhere. There are often > 1k trades in a day
    const [allWells, allTrades] = await Promise.all([
      BasinSubgraphRepository.getAllWells(block.number),
      BasinSubgraphRepository.getAllTrades(block.timestamp - ONE_DAY, block.timestamp)
    ]);
    const allPriceEvents = ExchangeService.priceEventsByWell(allWells, allTrades);

    // For each well in the subgraph, construct a formatted response
    const batchPromiseGenerators = [];
    for (const well of Object.values(allWells)) {
      batchPromiseGenerators.push(async () => {
        const [beanToken, nonBeanToken] = await Promise.all(well.tokens.map((t) => ERC20Info.getTokenInfo(t.address)));

        const [poolLiquidity, depth2] = await Promise.all([
          LiquidityUtil.calcWellLiquidityUSD(well, block.number),
          LiquidityUtil.calcDepth(well, 2)
        ]);
        const priceStats = ExchangeService.getWellPriceStats(well, allPriceEvents);

        // Filter pools having < 1k liquidity
        if (poolLiquidity < 1000) {
          return;
        }

        return {
          wellAddress: well.address,
          beanToken,
          nonBeanToken,
          exchangeRates: well.rates,
          rateChange24h: priceStats.percentRateChange,
          tokenVolume24h: well.biTokenVolume24h,
          tradeVolume24h: well.tradeVolume24h,
          liquidityUSD: parseFloat(poolLiquidity.toFixed(0)),
          depth2: {
            buy: depth2.buy.float,
            sell: depth2.sell.float
          },
          high: priceStats.high,
          low: priceStats.low
        };
      });
    }

    // Execute the above promises. Note that subgraph rate limit can become an issue as more whitelisted pools exist.
    // This can be improved by combining many of the separated queries together, or caching results in a database
    const results = await PromiseUtil.runBatchPromises(batchPromiseGenerators, 50);
    return results.filter((ticker) => ticker != null);
  }

  static async getTrades(options) {
    // Retrieve swaps matching the criteria
    const tokens = options.ticker_id.split('_');
    const swaps = await BasinSubgraphRepository.getWellSwapsForPair(
      tokens,
      options.start_time,
      options.end_time,
      Math.min(options.limit, 1000)
    );

    // Gather swap info
    const retval = [];
    for (const swap of swaps) {
      const type = swap.fromToken.id === tokens[0] ? 'sell' : 'buy';
      const effectivePrice = (swap.amountOut * BigInt(10 ** swap.fromToken.decimals)) / swap.amountIn;
      retval.push({
        id: swap.blockNumber * 10000 + swap.logIndex,
        rate: createNumberSpread(effectivePrice, swap.toToken.decimals).float,
        token0Volume: createNumberSpread(swap.amountIn, swap.fromToken.decimals).float,
        token1Volume: createNumberSpread(swap.amountOut, swap.toToken.decimals).float,
        timestamp: parseInt(swap.timestamp) * 1000,
        type
      });
    }

    if (options.type) {
      // One of buy/sell was explicitly requested
      return retval.filter((t) => t.type === options.type);
    }
    return retval;
  }

  // Organizes all trades by well, extracting price change information
  static priceEventsByWell(allWells, allTrades) {
    const formatted = allTrades.map((trade) => ({
      well: trade.well.id,
      rates: trade.afterTokenRates,
      timestamp: trade.timestamp
    }));

    const byWell = formatted.reduce(
      (acc, next) => {
        acc[next.well].push({
          rates: next.rates,
          timestamp: next.timestamp
        });
        return acc;
      },
      Object.keys(allWells).reduce((acc, next) => {
        acc[next] = [];
        return acc;
      }, {})
    );
    return byWell;
  }

  /**
   * Gets the change/high/low over the given time range
   * @param {WellDto} well - the well
   * @param {*} priceEvents - the price events for this well in the desired period, sorted by timestamp asc.
   * @returns change/high/low price over the given time period, in terms of the underlying tokens,
   *  with decimal precision alrady applied
   */
  static getWellPriceStats(well, allPriceEvents) {
    const priceEvents = allPriceEvents[well.address];

    if (priceEvents.length === 0) {
      // No trading activity over this period, returns the current rates
      return {
        percentRateChange: 0,
        high: well.rates,
        low: well.rates
      };
    }

    // Find 24h price change. Trades are already sorted by timestamp ascending.
    const fromRate = allPriceEvents[well.address][0].rates[1];
    const toRate = allPriceEvents[well.address].at(-1).rates[1];
    const delta = toRate - fromRate;
    const percentRateChange = delta / fromRate;

    const rates = priceEvents.map((e) => e.rates);
    // Return the min/max token price from the perspective of token0.
    // The maximal value of token0 is when fewer of its tokens can be bought with token1
    return {
      percentRateChange,
      high: rates.reduce((max, next) => (next[0] < max[0] ? next : max), rates[0]),
      low: rates.reduce((min, next) => (next[0] > min[0] ? next : min), rates[0])
    };
  }
}

module.exports = ExchangeService;
