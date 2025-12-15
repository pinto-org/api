const { SG_CACHE_CONFIG } = require('../../repository/subgraph/cache-config');
const SubgraphCache = require('../../repository/subgraph/subgraph-cache');

class GraphQLSchema {
  static async getTypeDefsAndResolvers() {
    const subgraphNames = new Set(Object.values(SG_CACHE_CONFIG).map((config) => config.subgraph));
    for (const subgraphName of subgraphNames) {
      const introspection = await SubgraphCache.introspect(subgraphName);
    }
    //
    const typeDefs = `
      type Entity {
        id: ID!
        name: String!
      }
      type Query {
        testEntity(season_gte: Int): [Entity!]!
        health: String!
      }
    `;

    const resolvers = {
      Query: Object.keys(SG_CACHE_CONFIG).reduce((acc, configKey) => {
        acc[configKey] = async (_parent, { where, ...args }, _ctx) => {
          const whereClause = Object.entries(args)
            .map(([key, value]) => `${key}: "${value}"`)
            .join(', ');
          const results = await SubgraphCache.get(configKey, whereClause);

          if (args.orderBy && args.orderDirection) {
            results.sort((a, b) => {
              if (args.orderDirection === 'asc') {
                return a[args.orderBy] - b[args.orderBy];
              }
              return b[args.orderBy] - a[args.orderBy];
            });
          }

          return results.slice(args.skip ?? 0, !!args.first ? (args.skip ?? 0) + args.first : undefined);
        };
        return acc;
      }, {})
      // {
      //   testEntity: async (a, b, c) => {
      //     console.log(a, b, c);
      //     return [{ id: '1', name: 'oks' + (b.season_gte ?? 'none') }];
      //   },
      //   health: () => 'oks1'
      // }
    };

    return { typeDefs, resolvers };
  }
}

module.exports = GraphQLSchema;
