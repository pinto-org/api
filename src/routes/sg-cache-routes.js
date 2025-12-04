const Router = require('koa-router');
const { createClient } = require('redis');

const router = new Router({
  prefix: '/sg-cache'
});

/* Temporary implementation for testing redis integration */

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
