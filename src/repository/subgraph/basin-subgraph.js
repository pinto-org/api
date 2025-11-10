const { gql } = require('graphql-request');
const { C } = require('../../constants/runtime-constants');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const WellDto = require('../dto/WellDto');
const TradeDto = require('../dto/TradeDto');

class BasinSubgraphRepository {
  static async getAllWells(blockNumber, c = C()) {
    const allWells = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
      {
        wells {
          ${WellDto.subgraphFields}
        }
      }`,
      `block: {number: ${blockNumber}}`,
      '',
      'isBeanstalk: true',
      {
        field: 'symbol',
        lastValue: ' ',
        direction: 'asc'
      }
    );
    return allWells
      .map((w) => new WellDto(w))
      .reduce((acc, next) => {
        acc[next.address] = next;
        return acc;
      }, {});
  }

  static async getWellSwapsForPair(tokens, fromTimestamp, toTimestamp, limit, c = C()) {
    const wellSwaps = await c.SG.BASIN(gql`
      {
        wells(where: { tokens: [${tokens.map((t) => `"${t}"`).join(', ')}] }) {
          trades(
            where: {
              tradeType: "SWAP"
              timestamp_gte: ${fromTimestamp}
              timestamp_lte: ${toTimestamp}
            }
            first: ${limit}
            orderBy: timestamp
            orderDirection: desc
          ) {
            tradeType
            swapAmountIn
            swapAmountOut
            swapFromToken {
              id
              decimals
            }
            swapToToken {
              id
              decimals
            }
            timestamp
            blockNumber
            logIndex
          }
        }
      }`);

    const flattenedSwaps = wellSwaps.wells.reduce((acc, next) => {
      acc.push(...next.trades);
      return acc;
    }, []);
    return flattenedSwaps.map((swapTrade) => new TradeDto(swapTrade));
  }

  static async getAllTrades(fromTimestamp, toTimestamp, c = C()) {
    const allTrades = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          trades {
            id
            tradeType
            well {
              id
            }
            afterTokenRates
            timestamp
            logIndex
          }
        }
      `,
      '',
      // Filter small trades to avoid retrieving too many enties that don't have significant price impact
      // In the future, these should be removed at the subgraph level as well to avoid entity bloat.
      `tradeVolumeUSD_gte: "100", timestamp_lte: "${toTimestamp}"`,
      {
        field: 'timestamp',
        lastValue: fromTimestamp.toFixed(0),
        direction: 'asc'
      }
    );
    return allTrades.map((trade) => new TradeDto(trade));
  }
}

module.exports = BasinSubgraphRepository;
