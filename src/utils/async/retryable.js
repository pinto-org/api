const timeoutPromise = (timeLimitMs, resolveTrigger) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Promise exceeded time limit')), timeLimitMs);
    resolveTrigger.timer = timeout;
  });

// Must provide a function such that a fresh thenable can be created upon invocation
// Early termination can occur if the error is not recoverable. This saves unnecessary retries on expected errors.
function retryable(asyncFunction, { timeLimitMs = 15000, retryCount = 2, earlyTerminate = () => false } = {}) {
  if (retryCount < 0) {
    return Promise.reject(new Error('Exceeded retry count'));
  }
  const resolveTrigger = {};
  return new Promise((resolve, reject) => {
    Promise.race([asyncFunction(), timeoutPromise(timeLimitMs, resolveTrigger)])
      // asyncFunction was successful
      .then((v) => {
        clearTimeout(resolveTrigger.timer);
        resolve(v);
      })
      // asyncFunction failed or timed out, retry
      .catch((e) => {
        clearTimeout(resolveTrigger.timer);
        if (earlyTerminate(e)) {
          reject(e);
        } else {
          retryable(asyncFunction, { timeLimitMs, retryCount: retryCount - 1, earlyTerminate })
            .then(resolve)
            .catch((_) => {
              // Reject with the original error
              reject(e);
            });
        }
      });
  });
}

module.exports = retryable;
