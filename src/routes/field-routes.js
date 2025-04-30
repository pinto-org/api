const FieldService = require('../service/field-service');

const Router = require('koa-router');
const router = new Router({
  prefix: '/field'
});

router.get('/plots-summary', async (ctx) => {
  const result = await FieldService.getAggregatePlotSummary(ctx.query.bucketSize);
  ctx.body = result;
});

module.exports = router;
