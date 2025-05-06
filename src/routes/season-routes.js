const Router = require('koa-router');
const SeasonService = require('../service/season-service');
const InputError = require('../error/input-error');
const router = new Router({
  prefix: '/seasons'
});

const SEASON_FIELDS = ['block', 'timestamp', 'sunriseTxn'];

/**
 * Gets basic info associated with all Seasons.
 * ?info: comma-separated list of fields to return. Options are: SEASON_FIELDS
 */
router.get('/', async (ctx) => {
  const returnFields = ctx.query.info?.split(',') ?? ['timestamp'];
  if (returnFields.some((f) => !SEASON_FIELDS.includes(f))) {
    throw new InputError(
      `Invalid info requested: ${returnFields.filter((f) => !SEASON_FIELDS.includes(f)).join(', ')}`
    );
  }

  const seasons = await SeasonService.getAll();

  ctx.body = seasons.reduce((acc, next) => {
    acc[next.season] = {};
    for (const field of returnFields) {
      acc[next.season][field] = next[field];
    }
    return acc;
  }, {});
});

module.exports = router;
