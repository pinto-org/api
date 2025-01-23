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

  // TODO: swaps, deposits, withdrawals can be combined into one. only are ever used in aggregate.
  static async getAllSwaps(fromTimestamp, toTimestamp, c = C()) {
    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          swaps {//TODO
            id
            well {
              id
            }
            tokenPrice
            timestamp
            logIndex
          }
        }
      `,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      {
        field: 'timestamp',
        lastValue: fromTimestamp.toFixed(0),
        direction: 'asc'
      }
    );
    allSwaps.forEach((s) => (s.tokenPrice = s.tokenPrice.map(BigInt)));
    return allSwaps;
  }

  static async getAllDeposits(fromTimestamp, toTimestamp, c = C()) {
    const allDeposits = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          deposits {//TODO
            id
            well {
              id
            }
            tokenPrice // TODO: consider this will get renamed and precision refactored.
            timestamp
            logIndex
          }
        }
      `,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      {
        field: 'timestamp',
        lastValue: fromTimestamp.toFixed(0),
        direction: 'asc'
      }
    );
    allDeposits.forEach((d) => (d.tokenPrice = d.tokenPrice.map(BigInt)));
    return allDeposits;
  }

  static async getAllWithdraws(fromTimestamp, toTimestamp, c = C()) {
    const allWithdraws = await SubgraphQueryUtil.allPaginatedSG(
      c.SG.BASIN,
      gql`
        {
          withdraws {//TODO
            id
            well {
              id
            }
            tokenPrice
            timestamp
            logIndex
          }
        }
      `,
      '',
      `timestamp_lte: "${toTimestamp}"`,
      {
        field: 'timestamp',
        lastValue: fromTimestamp.toFixed(0),
        direction: 'asc'
      }
    );
    allWithdraws.forEach((w) => (w.tokenPrice = w.tokenPrice.map(BigInt)));
    return allWithdraws;
  }
}

module.exports = BasinSubgraphRepository;
