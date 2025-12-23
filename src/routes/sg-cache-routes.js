const Router = require('koa-router');
const SubgraphCache = require('../repository/subgraph/subgraph-cache');

const router = new Router({
  prefix: '/sg-cache'
});

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
