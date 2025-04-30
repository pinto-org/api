const { default: Bottleneck } = require('bottleneck');

const Router = require('koa-router');
const router = new Router({
  prefix: '/proxy'
});

// Limit to 5 requests per 2 seconds
const limiter = new Bottleneck({
  reservoir: 50,
  reservoirIncreaseAmount: 5,
  reservoirIncreaseInterval: 2000,
  reservoirIncreaseMaximum: 100,
  maxConcurrent: 5,
  minTime: 2000 / 5
});

router.post('/ui-errors', async (ctx) => {
  const webhookUrl = process.env.DISCORD_UI_ERRORS;
  if (!webhookUrl) {
    return;
  }

  // Forward to Discord webhook
  try {
    await limiter.schedule(() =>
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx.request.body)
      })
    );
    ctx.status = 200;
    ctx.body = { message: 'Error logged successfully' };
  } catch (error) {
    console.error('Failed to log error:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to log error' };
  }
});

module.exports = router;
