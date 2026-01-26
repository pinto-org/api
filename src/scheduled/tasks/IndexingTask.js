class IndexingTask {
  static _lastQueuedBlock = null;
  static _lastExecutionTime = null;
  static _running = false;
  static _queueCounter = 0;
  static _isCaughtUp = false;

  /**
   * Attempts to execute the tasks, queuing an execution if its already running and the second request is unique.
   * @param blockNumber - the block an update is being requested for; ignores processing if already processed up to this block.
   * @param minIntervalMinutes - ignores queue requests if the task was recently executed within this interval.
   * @returns {Promise<{ countEvents: number, queuedCallersBehind: boolean, canExecuteAgain: boolean }>}
   */
  static async queueExecution({ blockNumber = -1, minIntervalMinutes = 0 } = {}) {
    if (blockNumber !== -1 && blockNumber <= this._lastQueuedBlock) {
      // Requested block number was already queued or processed
      return { countEvents: 0, queuedCallersBehind: false, canExecuteAgain: false };
    } else if (this._lastExecutionTime && Date.now() - this._lastExecutionTime < minIntervalMinutes * 60 * 1000) {
      // Minimum requested interval hasn't passed since the last execution
      return { countEvents: 0, queuedCallersBehind: false, canExecuteAgain: false };
    }

    if (blockNumber !== -1) {
      this._lastQueuedBlock = blockNumber;
    }

    const localCount = ++this._queueCounter;
    // Wait up to 20 seconds for the task to finish executing
    for (let i = 0; i < 20 && this._running; ++i) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // If another execution was queued during the wait, allow that one to execute instead
    if (!this._running && localCount === this._queueCounter) {
      try {
        this._running = true;
        // update return sig to be number of events, and boolean?
        const countEvents = await this.update();
        this._lastExecutionTime = new Date();
        return {
          countEvents,
          queuedCallersBehind: this._queueCounter > localCount,
          canExecuteAgain: !this.isCaughtUp() && countEvents !== false // false indicates task skipped
        };
      } finally {
        this._running = false;
      }
    }
    return { countEvents: 0, queuedCallersBehind: this._queueCounter > localCount, canExecuteAgain: false };
  }

  // Notifies of an event occuring in real-time via a websocket. Task decides how to proceed.
  static async handleLiveEvent(event) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Runs the task, updating as many blocks as possible
   * @returns {Promise<{updateBlock: number, processedEvents: number}>}
   */
  static async update() {
    throw new Error('Must be implemented by subclass');
  }

  // Indicates if the task is caught up to the latest block as of its most recent update.
  static isCaughtUp() {
    return this._isCaughtUp;
  }

  static getLastExecutionTime() {
    return this._lastExecutionTime;
  }
}

module.exports = IndexingTask;
