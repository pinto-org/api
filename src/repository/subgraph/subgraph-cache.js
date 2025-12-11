const { C } = require('../../constants/runtime-constants');
const redisClient = require('../../datasources/redis-client');
const SubgraphQueryUtil = require('../../utils/subgraph-query');
const { SG_CACHE_CONFIG } = require('./cache-config');
const CommonSubgraphRepository = require('./common-subgraph');

// Caches past season results for configured queries, enabling retrieval of the full history to be fast
class SubgraphCache {
  static async introspect(sgName) {
    const { deployment, schema } = await CommonSubgraphRepository.introspect(sgName);

    const fromCache = (await redisClient.get(`sg-deployment:${sgName}`)) === deployment;

    // Find the underlying types for each enabled query
    const queryInfo = {};
    const queryTypes = schema.types.find((t) => t.kind === 'OBJECT' && t.name === 'Query');
    for (const field of queryTypes.fields) {
      const configQuery = Object.entries(SG_CACHE_CONFIG).find(
        ([key, queryCfg]) => queryCfg.subgraph === sgName && queryCfg.queryName === field.name
      );
      if (configQuery) {
        let type = field.type;
        while (type.ofType) {
          type = type.ofType;
        }
        queryInfo[configQuery[0]] = {
          type: type.name
        };
      }
    }

    // Identify all fields accessible for each query
    for (const query in queryInfo) {
      const queryObject = schema.types.find((t) => t.kind === 'OBJECT' && t.name === queryInfo[query].type);
      queryInfo[query].fields = queryObject.fields.map((f) => f.name);
    }

    if (!fromCache) {
      await redisClient.set(`sg-deployment:${sgName}`, deployment);
      await redisClient.set(`sg-introspection:${sgName}`, JSON.stringify(queryInfo));
    }

    return { fromCache, introspection: queryInfo };
  }

  static async clear(sgName) {
    let cursor = '0';
    do {
      const reply = await redisClient.scan(cursor, {
        MATCH: `sg:${sgName}:*`,
        COUNT: 100
      });
      if (reply.keys.length > 0) {
        await redisClient.del(...reply.keys);
      }
      cursor = reply.cursor;
    } while (cursor !== '0');
  }

  // Returns { latest: <latest value>, cache: [<cached results>] }
  static async getCachedResults(cachedQueryName, where) {
    const cfg = SG_CACHE_CONFIG[cachedQueryName];
    const cachedResults = JSON.parse(await redisClient.get(`sg:${cfg.subgraph}:${cachedQueryName}:${where}`)) ?? [];

    return {
      latest:
        cachedResults?.[cachedResults.length - 1]?.[cfg.paginationSettings.field] ?? cfg.paginationSettings.lastValue,
      cache: cachedResults
    };
  }

  static async queryFreshResults(cachedQueryName, where, latestValue, introspection, c = C()) {
    const cfg = SG_CACHE_CONFIG[cachedQueryName];
    return await SubgraphQueryUtil.allPaginatedSG(
      cfg.client(c),
      `{ ${cfg.queryName} { ${introspection[cachedQueryName].fields.join(' ')} } }`,
      '',
      where,
      { ...cfg.paginationSettings, lastValue: latestValue }
    );
  }

  static async aggregateAndCache(cachedQueryName, where, cachedResults, freshResults) {
    const cfg = SG_CACHE_CONFIG[cachedQueryName];
    // The final element was re-retrieved and included in the fresh results.
    const aggregated = [...cachedResults.slice(0, -1), ...freshResults];
    await redisClient.set(`sg:${cfg.subgraph}:${cachedQueryName}:${where}`, JSON.stringify(aggregated));
    return aggregated;
  }
}
module.exports = SubgraphCache;
