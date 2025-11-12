const cron = require('node-cron');
const { sendWebhookMessage } = require('../utils/discord');
const SunriseTask = require('./tasks/sunrise');
const Log = require('../utils/logging');
const DepositsTask = require('./tasks/deposits');
const TractorTask = require('./tasks/tractor');
const InflowsTask = require('./tasks/inflows');

// All cron jobs which could be activated are configured here
const ALL_JOBS = {
  sunrise: {
    maxFrequency: 60 * 1000,
    cron: '50-59 59 * * * *',
    function: SunriseTask.handleSunrise
  },
  deposits: {
    executeOnStartup: true,
    // Updated less frequently because the underlying data is currently unused
    cron: '0 30 * * * *',
    function: async () => {
      while ((await DepositsTask.queueExecution(50)).canExecuteAgain) {}
    }
  },
  inflows: {
    executeOnStartup: true,
    // Updated less frequently because its only used for snapshots (and the ws should invoke it at sunrise)
    cron: '0 30 * * * *',
    function: async () => {
      while ((await InflowsTask.queueExecution(50)).canExecuteAgain) {}
    }
  },
  tractor: {
    executeOnStartup: true,
    cron: '0 */5 * * * *',
    function: async () => {
      while (true) {
        const { countEvents, canExecuteAgain } = await TractorTask.queueExecution(4.5);
        if (!canExecuteAgain) {
          if (countEvents > 0) {
            sendWebhookMessage(`Cron task processed ${countEvents} tractor events; websocket might be disconnected?`);
          }
          break;
        }
      }
    }
  },
  alert: {
    cron: '*/10 * * * * *',
    function: () => Log.info('10 seconds testing Alert')
  },
  failing: {
    cron: '*/5 * * * * *',
    function: () => {
      throw new Error('Testing cron ERROR!');
    }
  }
};

// Error handling wrapper for scheduled task functions
async function errorWrapper(fn) {
  try {
    await fn();
  } catch (e) {
    Log.info(e);
    // Send message only without the stack trace
    sendWebhookMessage(e.message);
  }
}

// Activates the requested cron jobs. If a job isn't included in ALL_JOBS, nothing happens
function activateJobs(jobNames) {
  let activated = [];
  let failed = [];

  for (const jobName of jobNames) {
    const job = ALL_JOBS[jobName];
    if (job) {
      const execute = () => {
        // This is to mitigate a quirk in node-cron where sometimes jobs are missed. Jobs can specify
        // a range of seconds they are willing to execute on, making it far less likely to drop.
        // This guard prevents double-execution.
        if (job.maxFrequency && Date.now() - job.__lastExecuted < job.maxFrequency) {
          return;
        }
        job.__lastExecuted = Date.now();

        errorWrapper(job.function);
      };
      if (job.executeOnStartup) {
        execute();
      }
      cron.schedule(job.cron, execute);
      activated.push(jobName);
    } else {
      failed.push(jobName);
    }
  }
  Log.info(`Activated ${activated.length} jobs: ${activated.join(', ')}`);
  if (failed.length > 0) {
    sendWebhookMessage(`Failed to activate jobs: ${failed.join(', ')}`);
    Log.info(`Failed to activate jobs: ${failed.join(', ')}`);
  }
}

module.exports = {
  activateJobs
};
