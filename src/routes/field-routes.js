const FieldService = require('../service/field-service');

const Router = require('koa-router');
const router = new Router({
  prefix: '/field'
});

router.get('/plots-summary', async (ctx) => {
  const params = {
    bucketSize: ctx.query.bucketSize ? parseInt(ctx.query.bucketSize) : undefined,
    onlyHarvested: ctx.query.onlyHarvested === 'true',
    onlyUnharvested: ctx.query.onlyUnharvested === 'true'
  };

  const result = await FieldService.getAggregatePlotSummary(params);
  ctx.body = result;
});

module.exports = router;
