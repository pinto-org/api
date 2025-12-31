const AlchemyUtil = require('../../src/datasources/alchemy');
const TaskRangeUtil = require('../../src/scheduled/util/task-range');
const ChainUtil = require('../../src/utils/chain');

const CHAIN_HEAD = 2500;
const BUFFER = 0; // Reduced as the reorg resistance was disabled in src

describe('TaskRangeUtil', () => {
  beforeEach(() => {
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: CHAIN_HEAD })
    });
    jest.spyOn(ChainUtil, 'blocksPerInterval').mockReturnValue(BUFFER);
  });

  test('Indicate if task uninitialized', async () => {
    const results = await TaskRangeUtil.getUpdateInfo({ lastUpdate: null }, 100);
    expect(results.isInitialized).toBeFalsy();
  });

  test('Assigns range when task catches up', async () => {
    const results = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 500, other: 5 }, CHAIN_HEAD * 2);
    expect(results.isInitialized).toBeTruthy();
    expect(results.lastUpdate).toBe(500);
    expect(results.updateBlock).toBe(CHAIN_HEAD - BUFFER);
    expect(results.isCaughtUp).toBe(true);
    expect(results.meta).toEqual({ lastUpdate: 500, other: 5 });
  });

  test('Assigns range when task stays behind', async () => {
    const results = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 750 }, 25);
    expect(results.isInitialized).toBeTruthy();
    expect(results.lastUpdate).toBe(750);
    expect(results.updateBlock).toBe(775);
    expect(results.isCaughtUp).toBe(false);
    expect(results.meta).toEqual({ lastUpdate: 750 });
  });

  test('Does not exceed maxReturnBlock option', async () => {
    const results = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 500 }, 500, { maxReturnBlock: 750 });
    expect(results.isInitialized).toBeTruthy();
    expect(results.lastUpdate).toBe(500);
    expect(results.updateBlock).toBe(750);
    expect(results.isCaughtUp).toBe(false);

    const results2 = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 500 }, 500, { maxReturnBlock: 2000 });
    expect(results2.isInitialized).toBeTruthy();
    expect(results2.lastUpdate).toBe(500);
    expect(results2.updateBlock).toBe(1000);
    expect(results2.isCaughtUp).toBe(false);
  });

  test('Skips paused range', async () => {
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: 34986390 })
    });
    // pauseBlocks: [[34970269, 34985390]]
    const prePause = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 34970250 }, 500, { skipPausedRange: true });

    expect(prePause.lastUpdate).toBe(34970250);
    expect(prePause.updateBlock).toBe(34970268);

    const postPause = await TaskRangeUtil.getUpdateInfo({ lastUpdate: 34970268 }, 500, { skipPausedRange: true });

    expect(postPause.lastUpdate).toBe(34985390);
    expect(postPause.updateBlock).toBeGreaterThan(34985390);
  });
});
