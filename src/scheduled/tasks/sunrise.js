const Contracts = require('../../datasources/contracts/contracts');
const SiloService = require('../../service/silo-service');
const YieldService = require('../../service/yield-service');
const Log = require('../../utils/logging');
const OnSunriseUtil = require('../util/on-sunrise');
const DepositsTask = require('./deposits');

class SunriseTask {
  static async handleSunrise() {
    const nextSeason = Number(await Contracts.getBeanstalk().season()) + 1;
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

    // Update whitelisted token info
    const tokenModels = await SiloService.updateWhitelistedTokenInfo();

    await YieldService.saveSeasonalApys({ tokenModels });

    // Next deposit update should mow all/etc.
    DepositsTask.__seasonUpdate = true;
  }
}

module.exports = SunriseTask;
