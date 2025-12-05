const Router = require('koa-router');
const { createClient } = require('redis');
const SubgraphQueryUtil = require('../utils/subgraph-query');
const { C } = require('../constants/runtime-constants');
const { gql } = require('graphql-request');

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
  const key = ctx.query.key;

  if (!key) {
    ctx.status = 400;
    ctx.body = {
      message: 'Query parameter `key` is required.'
    };
    return;
  }

  await testIntrospect();
  await testSnap();

  const value = JSON.parse(await redis.get(key));

  ctx.body = {
    key,
    value
  };
});

/**
 * Writes a value to the cache
 * Body should contain: { key: string, value: any }
 */
router.post('/', async (ctx) => {
  const { key, value } = ctx.request.body;

  if (!key) {
    ctx.status = 400;
    ctx.body = {
      message: 'Body parameter `key` is required.'
    };
    return;
  }

  if (value === undefined) {
    ctx.status = 400;
    ctx.body = {
      message: 'Body parameter `value` is required.'
    };
    return;
  }

  await redis.set(key, JSON.stringify(value));

  ctx.body = {
    success: true,
    key,
    message: 'Value cached successfully' // Placeholder - will be replaced with actual cache operation
  };
});

module.exports = router;

// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const config = {
  beanstalk: {
    queries: [
      {
        name: 'cached_siloHourlySnapshots',
        underlying: {
          name: 'siloHourlySnapshots',
          where: 'silo: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"',
          paginationSettings: {
            field: 'season',
            lastValue: 0,
            direction: 'asc'
          }
        }
      },
      {
        name: 'cached_fieldHourlySnapshots',
        underlying: {
          name: 'fieldHourlySnapshots',
          where: 'field: "0xd1a0d188e861ed9d15773a2f3574a2e94134ba8f"',
          paginationSettings: {
            field: 'season',
            lastValue: 0,
            direction: 'asc'
          }
        }
      }
    ]
  }
};

const testIntrospect = async (sgName, c = C()) => {
  const introspection = await c.SG[sgName.toUpperCase()](gql`
    query IntrospectionQuery {
      __schema {
        queryType {
          name
        }
        mutationType {
          name
        }
        subscriptionType {
          name
        }
        types {
          ...FullType
        }
        directives {
          name
          description
          locations
          args {
            ...InputValue
          }
        }
      }
    }
    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }
    fragment InputValue on __InputValue {
      name
      description
      type {
        ...TypeRef
      }
      defaultValue
    }
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  `);

  // Find the underlying types for each enabled query
  const queryInfo = {};
  const queryTypes = introspection.__schema.types.find((t) => t.kind === 'OBJECT' && t.name === 'Query');
  for (const field of queryTypes.fields) {
    const configQuery = config[sgName].queries.find((q) => q.underlying.name === field.name);
    if (configQuery) {
      let type = field.type;
      while (type.ofType) {
        type = type.ofType;
      }
      queryInfo[configQuery.name] = {
        type: type.name
      };
    }
  }

  // Identify all fields accessible for each query
  for (const query in queryInfo) {
    const queryObject = introspection.__schema.types.find(
      (t) => t.kind === 'OBJECT' && t.name === queryInfo[query].type
    );
    queryInfo[query].fields = queryObject.fields.map((f) => f.name);
  }

  console.log(queryInfo);
  console.log(Object.keys(queryInfo).map((k) => `{ ${k} { ${queryInfo[k].fields.join(' ')} } }`));

  await redis.set('introspection:beanstalk', JSON.stringify(queryInfo));
};

const testSnap = async (c = C()) => {
  const siloHourlySnapshots = await SubgraphQueryUtil.allPaginatedSG(
    c.SG.BEANSTALK,
    `
      { siloHourlySnapshots { id season silo stalk depositedBDV plantedBeans roots germinatingStalk penalizedStalkConvertDown unpenalizedStalkConvertDown avgConvertDownPenalty bonusStalkConvertUp totalBdvConvertUpBonus totalBdvConvertUp beanMints plantableStalk beanToMaxLpGpPerBdvRatio cropRatio avgGrownStalkPerBdvPerSeason grownStalkPerSeason convertDownPenalty activeFarmers deltaStalk deltaDepositedBDV deltaPlantedBeans deltaRoots deltaGerminatingStalk deltaPenalizedStalkConvertDown deltaUnpenalizedStalkConvertDown deltaAvgConvertDownPenalty deltaBonusStalkConvertUp deltaTotalBdvConvertUpBonus deltaTotalBdvConvertUp deltaBeanMints deltaPlantableStalk deltaBeanToMaxLpGpPerBdvRatio deltaCropRatio deltaAvgGrownStalkPerBdvPerSeason deltaGrownStalkPerSeason deltaConvertDownPenalty deltaActiveFarmers createdAt updatedAt caseId } }
    `,
    '',
    `silo: "${c.BEANSTALK}"`,
    {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    }
  );
  console.log(siloHourlySnapshots.length);
  console.log(siloHourlySnapshots.map((s) => s.season));
};

if (require.main === module) {
  (async () => {
    await testIntrospect('beanstalk');
    // await testSnap();
    // console.log(JSON.parse(await redis.get('introspection:beanstalk')));
  })();
}
