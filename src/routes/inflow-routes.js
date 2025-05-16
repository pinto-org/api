const Router = require('koa-router');
const CombinedInflowService = require('../service/inflow/combined-inflow-service');
const RestParsingUtil = require('../utils/rest-parsing');
const InputError = require('../error/input-error');

const router = new Router({
  prefix: '/inflows'
});

/**
 * Returns all combined protocol inflow snapshots matching the requested criteria.
 */
router.post('/combined', async (ctx) => {
  /** @type {import('../../types/types').CombinedInflowSnapshotsRequest} */
  const body = ctx.request.body;

  if (
    (body.limit !== undefined && typeof body.limit !== 'number') ||
    (body.skip !== undefined && typeof body.skip !== 'number')
  ) {
    throw new InputError('Invalid type provided for body parameter.');
  }

  RestParsingUtil.numberRangeValidation(body.betweenSeasons);

  const data = await CombinedInflowService.getCombinedInflowData(body);
  /** @type {import('../../types/types').CombinedInflowSnapshotsResult} */
  ctx.body = data;
});

module.exports = router;
