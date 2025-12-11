const Router = require('koa-router');
const { createClient } = require('redis');
const SubgraphCache = require('../repository/subgraph/subgraph-cache');

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
// Expand config
// Move things to better places
// Explore exposing graphql interface for the api
const config = {
  cache_siloHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    }
  },
  cache_fieldHourlySnapshots: {
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

if (require.main === module) {
  (async () => {
    const QUERY_NAME = 'cache_siloHourlySnapshots';
    const WHERE = 'silo: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"'.trim();

    console.time('query >9k seasons');
    const aggregated = await SubgraphCache.get(QUERY_NAME, WHERE);
    console.timeEnd('query >9k seasons');

    console.log(aggregated.slice(9270));

    process.exit(0);
  })();
}
