const Router = require('koa-router');
const { createClient } = require('redis');
const SubgraphQueryUtil = require('../utils/subgraph-query');
const { C } = require('../constants/runtime-constants');
const axios = require('axios');

const router = new Router({
  prefix: '/sg-cache'
});

/* Temporary area for testing redis integration */
// Configuration for which entities should be cached
// Need some control for which results go into the permanent storage, or when results move to permanent storage
// - better to write to it each hour, or only after a certain amount builds up?
// Need secondary kv store to track what is the current latest season captured within the permanent storage (for each entity)
// I suppose entities could track on something other than season? This should also be configurable.
// Need to clear cache upon new sg version; another reason its good to put this all in sg proxy? or can inspect header.

// -> next step: endpoint for retrieving a specific entity; underlying behavior should be to retrieve from cache and from sg

const redis = createClient({
  url: 'redis://localhost:6379'
});
redis.connect();

/**
 * Reads a value from the cache by key
 * ?key: the cache key to read
 */
router.get('/', async (ctx) => {
  const queryName = ctx.query.queryName;

  // Derive the latest season number already retrieved per query. And then retreive all gte that one.
  // Latest season will get rewritten always since it can be updating, and any further seasons would get appended to the cache.
  // Then can respond to user request for specific fields

  const queryInfo = await introspect('subgraph');
  const t = await testSnap(queryName, queryInfo);

  const value = JSON.parse(await redis.get(key));

  ctx.body = {
    key,
    value
  };
});

module.exports = router;

// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const config = {
  cached_siloHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    }
  },
  cached_fieldHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'fieldHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    }
  }
};

const introspect = async (sgName) => {
  const introspection = await axios.post(`https://graph.pinto.money/${sgName}`, {
    query:
      'query IntrospectionQuery { __schema { queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description locations args { ...InputValue } } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } } fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }'
  });

  const deployment = introspection.headers['x-deployment'];
  const schema = introspection.data.data.__schema;

  if ((await redis.get(`sg-deployment:${sgName}`)) === deployment) {
    return { fromCache: true, introspection: JSON.parse(await redis.get(`sg-introspection:${sgName}`)) };
  }

  // Find the underlying types for each enabled query
  const queryInfo = {};
  const queryTypes = schema.types.find((t) => t.kind === 'OBJECT' && t.name === 'Query');
  for (const field of queryTypes.fields) {
    const configQuery = Object.entries(config).find(
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

  // Should also save the subgraph version number and only recompute this if that changes
  await redis.set(`sg-deployment:${sgName}`, deployment);
  await redis.set(`sg-introspection:${sgName}`, JSON.stringify(queryInfo));

  return { fromCache: false, introspection: queryInfo };
};

const clearSubgraphCache = async (subgraph) => {
  let cursor = '0';
  do {
    const reply = await redis.scan(cursor, {
      MATCH: `sg:${subgraph}:*`,
      COUNT: 100
    });
    if (reply.keys.length > 0) {
      await redis.del(...reply.keys);
    }
    cursor = reply.cursor;
  } while (cursor !== '0');
};

// Returns { latest: <latest value>, cache: [<cached results>] }
const getCachedResults = async (cachedQueryName, where) => {
  const cfg = config[cachedQueryName];
  const cachedResults = JSON.parse(await redis.get(`sg:${cfg.subgraph}:${cachedQueryName}:${where}`)) ?? [];

  return {
    latest:
      cachedResults?.[cachedResults.length - 1]?.[cfg.paginationSettings.field] ?? cfg.paginationSettings.lastValue,
    cache: cachedResults
  };
};

const queryFreshResults = async (cachedQueryName, where, latestValue, introspection, c = C()) => {
  const cfg = config[cachedQueryName];
  return await SubgraphQueryUtil.allPaginatedSG(
    cfg.client(c),
    `{ ${cfg.queryName} { ${introspection[cachedQueryName].fields.join(' ')} } }`,
    '',
    where,
    { ...cfg.paginationSettings, lastValue: latestValue }
  );
};

const aggregateAndCache = async (cachedQueryName, where, cachedResults, freshResults) => {
  const cfg = config[cachedQueryName];
  // The final element was re-retrieved and included in the fresh results.
  const aggregated = [...cachedResults.slice(0, -1), ...freshResults];
  await redis.set(`sg:${cfg.subgraph}:${cachedQueryName}:${where}`, JSON.stringify(aggregated));
  return aggregated;
};

if (require.main === module) {
  (async () => {
    const QUERY_NAME = 'cached_siloHourlySnapshots';
    const WHERE = 'silo: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"'.trim();
    const sgName = config[QUERY_NAME].subgraph;

    console.time('query >9k seasons');

    const { fromCache, introspection } = await introspect(sgName);
    console.log('introspection from cache?', fromCache);
    if (!fromCache) {
      console.log(`New deployment detected; clearing subgraph cache for ${sgName}`);
      await clearSubgraphCache(sgName);
    }

    const { latest, cache } = await getCachedResults(QUERY_NAME, WHERE);
    console.log('latest', latest, 'cache length', cache.length);
    const freshResults = await queryFreshResults(QUERY_NAME, WHERE, latest, introspection);
    console.log('fresh results length', freshResults.length);
    const aggregated = await aggregateAndCache(QUERY_NAME, WHERE, cache, freshResults);
    console.log('aggregated results length', aggregated.length);

    console.timeEnd('query >9k seasons');

    console.log(aggregated.slice(9270));

    process.exit(0);
  })();
}
