class IndexingTask {
  static _lastExecution = null;
  static _running = false;
  static _queueCounter = 0;

  // Runs update immediately if nothing is executing, otherwise queues an update execution.
  static async queueExecution(minIntervalMinutes = 0) {
    // Ensure at least the minimum requested interval has passed since the last execution
    if (this._lastExecution && Date.now() - this._lastExecution < minIntervalMinutes * 60 * 1000) {
      return { countEvents: 0, canExecuteAgain: false };
    }

    const localCount = ++this._queueCounter;
    // Wait up to 20 seconds for the task to finish executing
    for (let i = 0; i < 20 && this._running; ++i) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // If another execution was queued during the wait, allow that one to execute instead
    if (localCount === this._queueCounter) {
      try {
        this._running = true;
        // update return sig to be number of events, and boolean?
        const { countEvents, canExecuteAgain } = await this.update();
        this._lastExecution = new Date();
        return { countEvents, canExecuteAgain };
      } finally {
        this._running = false;
      }
    }
    return false;
  }

  // Notifies of an event occuring in real-time via a websocket. Task decides how to proceed.
  static async handleLiveEvent(event) {
    throw new Error('Must be implemented by subclass');
  }

  // Runs the task, updating as many blocks as possible
  static async update() {
    throw new Error('Must be implemented by subclass');
  }
}

module.exports = IndexingTask;
