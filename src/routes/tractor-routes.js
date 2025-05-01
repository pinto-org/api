const TractorConstants = require('../constants/tractor');
const InputError = require('../error/input-error');
const { TractorOrderType } = require('../repository/postgres/models/types/types');
const SnapshotSowV0Service = require('../service/tractor/snapshot-sow-v0-service');
const TractorService = require('../service/tractor/tractor-service');

const Router = require('koa-router');
const router = new Router({
  prefix: '/tractor'
});

const dateRangeValidation = (dateRange) => {
  if (dateRange) {
    if (
      !Array.isArray(dateRange) ||
      dateRange.length !== 2 ||
      !(dateRange[0] instanceof Date) ||
      !(dateRange[1] instanceof Date) ||
      dateRange[1] <= dateRange[0]
    ) {
      throw new InputError('Invalid date range provided. Must be array of 2 dates with end date after start date.');
    }
  }
};

const numberRangeValidation = (numberRange) => {
  if (numberRange) {
    if (
      !Array.isArray(numberRange) ||
      numberRange.length !== 2 ||
      typeof numberRange[0] !== 'number' ||
      typeof numberRange[1] !== 'number' ||
      numberRange[1] <= numberRange[0]
    ) {
      throw new InputError('Invalid seasons range provided.');
    }
  }
};

/**
 * Returns all tractor orders matching the requested criteria. Includes all info about specialized blueprints
 */
router.post('/orders', async (ctx) => {
  /** @type {import('../../types/types').TractorOrderRequest} */
  const body = ctx.request.body;

  if (body.orderType && ![...Object.keys(TractorOrderType), 'KNOWN', 'UNKNOWN'].includes(body.orderType)) {
    throw new InputError('Invalid orderType provided.');
  }

  if (
    (body.blueprintHash && typeof body.blueprintHash !== 'string') ||
    (body.publisher && typeof body.publisher !== 'string') ||
    (body.limit !== undefined && typeof body.limit !== 'number') ||
    (body.skip !== undefined && typeof body.skip !== 'number') ||
    (body.cancelled !== undefined && typeof body.cancelled !== 'boolean')
  ) {
    throw new InputError('Invalid type provided for body parameter.');
  }

  body.publishedBetween = body.publishedBetween?.map((v) => new Date(v));
  body.validBetween = body.validBetween?.map((v) => new Date(v));
  dateRangeValidation(body.publishedBetween);
  dateRangeValidation(body.validBetween);

  if (body.blueprintParams) {
    if (!body.orderType) {
      throw new InputError('orderType is required when blueprintParams is specified.');
    }
    const blueprint = TractorConstants.knownBlueprints()[body.orderType];
    if (!blueprint) {
      throw new InputError('No blueprint found for the provided orderType.');
    }
    blueprint.validateOrderParams(body.blueprintParams);
  }

  /** @type {import('../../types/types').TractorOrdersResult} */
  const results = await TractorService.getOrders(body);
  ctx.body = results;
});

/**
 * Returns all tractor executions matching the requested criteria. Includes all info about specialized blueprints
 */
router.post('/executions', async (ctx) => {
  /** @type {import('../../types/types').TractorExecutionRequest} */
  const body = ctx.request.body;

  if (body.orderType && ![...Object.keys(TractorOrderType), 'KNOWN', 'UNKNOWN'].includes(body.orderType)) {
    throw new InputError('Invalid orderType provided.');
  }

  if (
    (body.blueprintHash && typeof body.blueprintHash !== 'string') ||
    (body.nonce !== undefined && typeof body.nonce !== 'number') ||
    (body.publisher && typeof body.publisher !== 'string') ||
    (body.operator && typeof body.operator !== 'string') ||
    (body.limit !== undefined && typeof body.limit !== 'number') ||
    (body.skip !== undefined && typeof body.skip !== 'number')
  ) {
    throw new InputError('Invalid type provided for body parameter.');
  }

  body.executedBetween = body.executedBetween?.map((v) => new Date(v));
  dateRangeValidation(body.executedBetween);

  if (body.blueprintParams) {
    if (!body.orderType) {
      throw new InputError('orderType is required when blueprintParams is specified.');
    }
    const blueprint = TractorConstants.knownBlueprints()[body.orderType];
    if (!blueprint) {
      throw new InputError('No blueprint found for the provided orderType.');
    }
    blueprint.validateExecutionParams(body.blueprintParams);
  }

  /** @type {import('../../types/types').TractorExecutionsResult} */
  const results = await TractorService.getExecutions(body);
  ctx.body = results;
});

/**
 * Returns all tractor state snapshots matching the requested criteria.
 */
router.post('/snapshots', async (ctx) => {
  /** @type {import('../../types/types').TractorSnapshotsRequest} */
  const body = ctx.request.body;

  if (!TractorOrderType[body.orderType]) {
    throw new InputError('Invalid orderType provided.');
  }

  if (
    (body.limit !== undefined && typeof body.limit !== 'number') ||
    (body.skip !== undefined && typeof body.skip !== 'number')
  ) {
    throw new InputError('Invalid type provided for body parameter.');
  }

  body.between = body.between?.map((v) => new Date(v));
  dateRangeValidation(body.between);

  numberRangeValidation(body.betweenSeasons);

  let method;
  if (body.orderType === 'SOW_V0') {
    method = SnapshotSowV0Service.getSnapshots.bind(SnapshotSowV0Service);
  }

  /** @type {import('../../types/types').TractorSnapshotsResult} */
  const results = await method(body);
  ctx.body = results;
});

module.exports = router;
