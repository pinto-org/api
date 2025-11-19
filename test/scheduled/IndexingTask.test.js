const IndexingTask = require('../../src/scheduled/tasks/IndexingTask');

describe('IndexingTask', () => {
  let mockUpdate;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockUpdate = jest.spyOn(IndexingTask, 'update').mockResolvedValue(0);

    // Reset static properties before each test
    IndexingTask._lastQueuedBlock = null;
    IndexingTask._lastExecutionTime = null;
    IndexingTask._running = false;
    IndexingTask._queueCounter = 0;
    IndexingTask._isCaughtUp = false;
  });

  afterEach(() => {
    expect(IndexingTask._running).toBeFalsy();
    jest.useRealTimers();
  });

  describe('queueExecution', () => {
    it('should return early if blockNumber was already queued', async () => {
      IndexingTask._lastQueuedBlock = 100;

      await IndexingTask.queueExecution({ blockNumber: 100 });

      expect(IndexingTask._lastQueuedBlock).toBe(100);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should return early if blockNumber is less than last queued block', async () => {
      IndexingTask._lastQueuedBlock = 100;

      await IndexingTask.queueExecution({ blockNumber: 50 });

      expect(IndexingTask._lastQueuedBlock).toBe(100);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should return early if minimum interval has not passed', async () => {
      IndexingTask._lastExecutionTime = new Date(Date.now() - 4 * 60 * 1000);

      await IndexingTask.queueExecution({ minIntervalMinutes: 5 });

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should proceed if minimum interval has passed', async () => {
      IndexingTask._lastExecutionTime = new Date(Date.now() - 10 * 60 * 1000);

      await IndexingTask.queueExecution({ minIntervalMinutes: 5 });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update _lastQueuedBlock when valid blockNumber is provided', async () => {
      IndexingTask._lastQueuedBlock = 100;

      await IndexingTask.queueExecution({ blockNumber: 200 });

      expect(IndexingTask._lastQueuedBlock).toBe(200);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should not update _lastQueuedBlock when blockNumber isnt provided', async () => {
      IndexingTask._lastQueuedBlock = 100;

      await IndexingTask.queueExecution();

      expect(IndexingTask._lastQueuedBlock).toBe(100);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return correct result when update is successful', async () => {
      mockUpdate.mockResolvedValue(10);
      jest.spyOn(IndexingTask, 'isCaughtUp').mockReturnValue(true);

      const { countEvents, canExecuteAgain } = await IndexingTask.queueExecution({ blockNumber: 200 });

      expect(countEvents).toBe(10);
      expect(canExecuteAgain).toBe(false);
    });

    it('should wait for running task to finish before executing', async () => {
      jest.useFakeTimers();
      IndexingTask._running = true;

      const queuePromise = IndexingTask.queueExecution({ blockNumber: 500 });

      // Still waiting on running task
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockUpdate).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockUpdate).not.toHaveBeenCalled();

      // Stop the running task
      IndexingTask._running = false;

      // Advance time to complete waiting
      await jest.advanceTimersByTimeAsync(1000);
      await queuePromise;

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should not run task if exceeds wait time', async () => {
      jest.useFakeTimers();
      IndexingTask._running = true;

      const queuePromise = IndexingTask.queueExecution({ blockNumber: 600 });

      // Advance many wait times
      for (let i = 0; i < 50; ++i) {
        await jest.advanceTimersByTimeAsync(1000);
      }

      // Task should still be running from another caller, this wont update
      await queuePromise;

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(IndexingTask._running).toBeTruthy();
      IndexingTask._running = false;
    });

    it('should not execute if another execution was queued during wait', async () => {
      jest.useFakeTimers();
      // Simulate a task that's already running
      IndexingTask._running = true;

      mockUpdate.mockResolvedValue(5);

      // First execution starts waiting
      const firstPromise = IndexingTask.queueExecution({ blockNumber: 700 });
      // Queue another execution
      const secondPromise = IndexingTask.queueExecution({ blockNumber: 701 });

      // Stop the running task so both can proceed
      IndexingTask._running = false;

      // Advance time to complete both executions
      await jest.runAllTimersAsync();

      const firstResult = await firstPromise;
      const secondResult = await secondPromise;

      // First execution should be skipped because another arrived during wait
      expect(firstResult).toEqual({ countEvents: 0, queuedCallersBehind: true, canExecuteAgain: false });
      expect(secondResult).toEqual({ countEvents: 5, queuedCallersBehind: false, canExecuteAgain: true });
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('should set _running flag during execution and clear it after', async () => {
      mockUpdate.mockImplementation(async () => {
        expect(IndexingTask._running).toBe(true);
        return 10;
      });

      await IndexingTask.queueExecution({ blockNumber: 800 });

      expect(IndexingTask._running).toBe(false);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should clear _running flag even if update throws an error', async () => {
      mockUpdate.mockImplementation(async () => {
        expect(IndexingTask._running).toBe(true);
        throw new Error('Update failed');
      });

      const resultPromise = IndexingTask.queueExecution({ blockNumber: 900 });

      // Verify the promise rejects and _running is cleared
      try {
        await resultPromise;
        throw new Error('Expected error to be thrown, but wasnt');
      } catch (error) {
        errorThrown = true;
        expect(error.message).toBe('Update failed');
      }

      expect(IndexingTask._running).toBe(false);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update _lastExecutionTime after successful execution', async () => {
      expect(IndexingTask._lastExecutionTime).toBeNull();

      const startTime = Date.now();
      await IndexingTask.queueExecution({ blockNumber: 1000 });

      expect(IndexingTask._lastExecutionTime).toBeInstanceOf(Date);
      expect(IndexingTask._lastExecutionTime.getTime()).toBeGreaterThanOrEqual(startTime);
    });
  });
});
