const TractorConstants = require('../constants/tractor');
const InputError = require('../error/input-error');
const { TractorOrderType } = require('../repository/postgres/models/types/types');
const SnapshotSowService = require('../service/tractor/snapshots/snapshot-sow-service');
const TractorService = require('../service/tractor/tractor-service');

const Router = require('koa-router');
const RestParsingUtil = require('../utils/rest-parsing');
const SnapshotConvertUpService = require('../service/tractor/snapshots/snapshot-convert-up-service');
const router = new Router({
  prefix: '/tractor'
});

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
  RestParsingUtil.dateRangeValidation(body.publishedBetween);
  RestParsingUtil.dateRangeValidation(body.validBetween);

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
  RestParsingUtil.dateRangeValidation(body.executedBetween);

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
 * @deprecated use v2 instead
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
  RestParsingUtil.dateRangeValidation(body.between);

  RestParsingUtil.numberRangeValidation(body.betweenSeasons);

  let method;
  if (body.orderType === 'SOW_V0') {
    method = SnapshotSowService.getSnapshots.bind(SnapshotSowService);
  } else if (body.orderType === 'CONVERT_UP_V0') {
    method = SnapshotConvertUpService.getSnapshots.bind(SnapshotConvertUpService);
  }

  /** @type {import('../../types/types').TractorSnapshotsResult} */
  const results = await method(body);
  ctx.body = results;
});

/**
 * Returns all tractor state snapshots matching the requested criteria.
 */
router.post('/v2/snapshots', async (ctx) => {
  /** @type {import('../../types/types').TractorV2SnapshotsRequest} */
  const body = ctx.request.body;

  if (
    (body.orderTypes && !Array.isArray(body.orderTypes)) ||
    (body.limit !== undefined && typeof body.limit !== 'number') ||
    (body.skip !== undefined && typeof body.skip !== 'number')
  ) {
    throw new InputError('Invalid type provided for body parameter.');
  }

  const orderTypes = body.orderTypes ?? Object.keys(TractorOrderType);
  if (orderTypes.some((type) => !TractorOrderType[type])) {
    throw new InputError('Invalid orderType provided.');
  }

  body.between = body.between?.map((v) => new Date(v));
  RestParsingUtil.dateRangeValidation(body.between);

  RestParsingUtil.numberRangeValidation(body.betweenSeasons);

  const results = await Promise.all(
    orderTypes.map(async (type) => {
      if (type === 'SOW_V0') {
        return await SnapshotSowService.getSnapshots(body);
      } else if (type === 'CONVERT_UP_V0') {
        return await SnapshotConvertUpService.getSnapshots(body);
      }
    })
  );

  /** @type {import('../../types/types').TractorV2SnapshotsResult} */
  ctx.body = {
    lastUpdated: results[0].lastUpdated,
    snapshots: results.reduce((acc, next, idx) => {
      acc[orderTypes[idx]] = next.snapshots;
      return acc;
    }, {}),
    maxRecords: results.reduce((max, result) => Math.max(max, result.totalRecords), 0)
  };
});

module.exports = router;
