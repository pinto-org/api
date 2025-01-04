const SiloService = require('../../service/silo-service');
const YieldService = require('../../service/yield-service');
const Log = require('../../utils/logging');
const OnSunriseUtil = require('../util/on-sunrise');
const DepositsTask = require('./deposits');

class SunriseTask {
  static async handleSunrise() {
    Log.info('Waiting for sunrise to be processed by subgraphs...');
    try {
      // Wait 5.5 mins, fails + notifies if unsuccessful
      await OnSunriseUtil.waitForSunrise(5.5 * 60 * 1000);
    } catch (e) {
      Log.info('Sunrise not detected yet, sent notification and still waiting...');
      // Wait up to an additional 50 mins. Dont re-catch on failure
      await OnSunriseUtil.waitForSunrise(50 * 60 * 1000);
    }
    Log.info('Sunrise was processed by the subgraphs, proceeding.');

    // Update whitelisted token info
    const tokenModels = await SiloService.updateWhitelistedTokenInfo();

    await YieldService.saveSeasonalApys({ tokenModels });

    // Next deposit update should mow all/etc.
    DepositsTask.__seasonUpdate = true;
  }
}

module.exports = SunriseTask;
