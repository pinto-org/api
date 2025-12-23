const { SG_CACHE_CONFIG } = require('../../repository/subgraph/cache-config');
const SubgraphCache = require('../../repository/subgraph/subgraph-cache');

class GraphQLSchema {
  static async getTypeDefsAndResolvers() {
    const subgraphQueries = Object.values(SG_CACHE_CONFIG).reduce((acc, next) => {
      (acc[next.subgraph] ??= []).push(next.queryName);
      return acc;
    }, {});
    let introspection = {};
    for (const subgraphName in subgraphQueries) {
      introspection = { ...introspection, ...(await SubgraphCache.introspect(subgraphName)) };
    }

    const typeDefs = `
      scalar BigInt
      scalar BigDecimal
      ${Object.keys(introspection).map(
        (query) =>
          `type ${introspection[query].type} {
            ${introspection[query].fields
              .filter((f) => !SG_CACHE_CONFIG[query].omitFields?.includes(f.name))
              .map((f) => `${f.name}: ${f.typeName}`)
              .join('\n')}
          }`
      )}
      type Query {
        ${Object.keys(introspection)
          .map((query) => `${query}: [${introspection[query].type}!]!`)
          .join('\n')}
      }
    `;
    //type Query {
    //    testEntity(season_gte: Int): [Entity!]!
    //   health: String!
    // }

    const resolvers = {
      Query: Object.keys(SG_CACHE_CONFIG).reduce((acc, configKey) => {
        // Each query supports generic where clause, and order/pagination related args
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

if (require.main === module) {
  (async () => {
    const { typeDefs, resolvers } = await GraphQLSchema.getTypeDefsAndResolvers();
    console.log(typeDefs);
    console.log(resolvers);
  })();
}
