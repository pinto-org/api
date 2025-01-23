const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const BasinSubgraphRepository = require('../repository/subgraph/basin-subgraph');
const PromiseUtil = require('../utils/async/promise');
const LiquidityUtil = require('./utils/pool/liquidity');
const NumberUtil = require('../utils/number');
const { C } = require('../constants/runtime-constants');

const ONE_DAY = 60 * 60 * 24;

class CoingeckoService {
  static async getTickers(options = {}) {
    // Determine block
    const block = await BlockUtil.blockForSubgraphFromOptions(C().SG.BASIN, options);

    // Retrieve all results upfront from Basin subgraph.
    // This strategy is optimized for performance/minimal load against subgraph api rate limits.
    const allWells = await BasinSubgraphRepository.getAllWells(block.number);
    const allPriceEvents = await CoingeckoService.getAllPriceChanges(allWells, block.timestamp);

    // For each well in the subgraph, construct a formatted response
    const batchPromiseGenerators = [];
    for (const well of Object.values(allWells)) {
      batchPromiseGenerators.push(async () => {
        // Filter pools having < 1k liquidity
        const poolLiquidity = await LiquidityUtil.calcWellLiquidityUSD(well, block.number);
        if (poolLiquidity < 1000) {
          return;
        }

        const [base_currency, target_currency] = well.tokens.map((t) => t.address);

        const depth2 = await LiquidityUtil.calcDepth(well, 2);
        const priceRange = CoingeckoService.getWellPriceRange(well, allPriceEvents);

        const ticker = {
          ticker_id: `${base_currency}_${target_currency}`,
          base_currency,
          target_currency,
          pool_id: well.address,
          last_price: well.rates[1],
          base_volume: well.biTokenVolume24h.float[0],
          target_volume: well.biTokenVolume24h.float[1],
          liquidity_in_usd: parseFloat(poolLiquidity.toFixed(0)),
          depth2: {
            buy: depth2.buy.float,
            sell: depth2.sell.float
          },
          high: priceRange.high[1],
          low: priceRange.low[1]
        };
        return ticker;
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

    // Format the response
    const retval = {
      buy: [],
      sell: []
    };
    for (const swap of swaps) {
      const type = swap.fromToken.id === tokens[0] ? 'sell' : 'buy';
      const effectivePrice = (swap.amountOut * BigInt(10 ** swap.fromToken.decimals)) / swap.amountIn;
      retval[type].push({
        trade_id: swap.blockNumber * 10000 + swap.logIndex,
        price: createNumberSpread(effectivePrice, swap.toToken.decimals).float,
        base_volume: createNumberSpread(swap.amountIn, swap.fromToken.decimals).float,
        target_volume: createNumberSpread(swap.amountOut, swap.toToken.decimals).float,
        trade_timestamp: parseInt(swap.timestamp) * 1000,
        type: type
      });
    }

    if (options.type) {
      // One of buy/sell was explicitly requested
      return {
        [options.type]: retval[options.type]
      };
    }
    return retval;
  }

  /**
   * Retrieves all trades/LP events for all wells in the given time range.
   * @param {*} allWells - contains all wells represented as WellDto
   * @param {number} timestamp - the upper bound timestamp
   * @param {number} lookback - amount of time to look in the past
   * @returns all changes in price rates for each well
   */
  static async getAllPriceChanges(allWells, timestamp, lookback = ONE_DAY) {
    const allTrades = await BasinSubgraphRepository.getAllTrades(timestamp - lookback, timestamp);

    const flattened = allTrades.map((trade) => ({
      well: trade.well.id,
      rates: trade.afterTokenRates,
      timestamp: trade.timestamp
    }));

    const byWell = flattened.reduce(
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
   * Gets the high/low over the given time range
   * @param {WellDto} well - the well
   * @param {*} priceEvents - the price events for this well in the desired period
   * @returns high/low price over the given time period, in terms of the underlying tokens,
   *  with decimal precision alrady applied
   */
  static getWellPriceRange(well, allPriceEvents) {
    const priceEvents = allPriceEvents[well.address];

    if (priceEvents.length === 0) {
      // No trading activity over this period, returns the current rates
      return {
        high: well.rates,
        low: well.rates
      };
    }

    const rates = priceEvents.map((e) => e.rates);
    // Return the min/max token price from the perspective of token0.
    // The maximal value of token0 is when fewer of its tokens can be bought with token1
    return {
      high: rates.reduce((max, next) => (next[0] < max[0] ? next : max), rates[0]),
      low: rates.reduce((min, next) => (next[0] > min[0] ? next : min), rates[0])
    };
  }
}

module.exports = CoingeckoService;
