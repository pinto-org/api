const ApySeeder = require('../../repository/postgres/startup-seeders/apy-seeder');
const SeasonSeeder = require('../../repository/postgres/startup-seeders/season-seeder');
const BeanstalkSubgraphRepository = require('../../repository/subgraph/beanstalk-subgraph');
const SeasonService = require('../../service/season-service');
const SiloService = require('../../service/silo-service');
const YieldService = require('../../service/yield-service');
const { sendWebhookMessage } = require('../../utils/discord');
const Log = require('../../utils/logging');
const OnSunriseUtil = require('../util/on-sunrise');
const DepositsTask = require('./deposits');

class SunriseTask {
  static async handleSunrise() {
    const nextSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season + 1;
    Log.info(`Waiting for season ${nextSeason} to be processed by subgraphs...`);
    try {
      // Wait 5.5 mins, fails + notifies if unsuccessful
      await OnSunriseUtil.waitForSunrise(nextSeason, 5.5 * 60 * 1000);
    } catch (e) {
      Log.info(`Season ${nextSeason} not detected yet, sent notification and still waiting...`);
      // Wait up to an additional 50 mins. Dont re-catch on failure
      await OnSunriseUtil.waitForSunrise(nextSeason, 50 * 60 * 1000);
    }
    Log.info(`Season ${nextSeason} was processed by the subgraphs, proceeding.`);

    try {
      // Insert basic season info
      await SeasonService.insertSeasonFromEvent(nextSeason);

      // Update whitelisted token info
      const tokenModels = await SiloService.updateWhitelistedTokenInfo();

      await YieldService.saveSeasonalApys({ tokenModels });

      // Next deposit update should mow all/etc.
      DepositsTask.__seasonUpdate = true;
    } catch (e) {
      // Need to understand why this error happens before it can be properly mitigated. Currently the data will be unavailable
      // for at least one hour, until the subsequent sunrise and the seeders are triggered afterwards.
      await sendWebhookMessage(`Failed to complete processing for season ${nextSeason}`);
      Log.info(e);
      throw e;
    }

    // Rerun the seeders to fill in any seasons which are missing.
    if (!SeasonSeeder.__active) {
      await SeasonSeeder.run();
    }
    if (!ApySeeder.__active) {
      await ApySeeder.run();
    }
  }
}

module.exports = SunriseTask;
