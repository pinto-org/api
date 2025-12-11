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

  const queryInfo = await testIntrospect();
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
    // TODO: ideally we could cache by farmers too? not sure if the ui actually uses this currently
    where: 'silo: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"',
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
    where: 'field: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"',
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    }
  }
};

const testIntrospect = async (sgName) => {
  const introspection = await axios.post(`https://graph.pinto.money/${sgName}`, {
    query:
      'query IntrospectionQuery { __schema { queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description locations args { ...InputValue } } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } } fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }'
  });

  const deployment = introspection.headers['x-deployment'];
  const schema = introspection.data.data.__schema;

  if ((await redis.get(`sg-deployment:${sgName}`)) === deployment) {
    console.log('using cached introspection');
    return JSON.parse(await redis.get(`sg-introspection:${sgName}`));
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

  return queryInfo;
};

const testSnap = async (queryName, introspectedInfo, c = C()) => {
  const cfg = config[queryName];

  const siloHourlySnapshots = await SubgraphQueryUtil.allPaginatedSG(
    cfg.client(c),
    `{ ${queryName} { ${introspectedInfo[queryName].fields.join(' ')} } }`,
    '',
    cfg.where,
    cfg.paginationSettings // TODO: here it should put in the min season as to whatever we have already retrieved
  );
  console.log(siloHourlySnapshots.length);
  console.log(siloHourlySnapshots.map((s) => s.season));
};

if (require.main === module) {
  (async () => {
    const queryInfo = await testIntrospect('pintostalk');
    console.log(queryInfo);
    console.log(Object.keys(queryInfo).map((k) => `{ ${k} { ${queryInfo[k].fields.join(' ')} } }`));
    // await testSnap();
    // console.log(JSON.parse(await redis.get('introspection:beanstalk')));
  })();
}
