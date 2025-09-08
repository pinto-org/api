const SiloService = require('../../../service/silo-service');
const YieldService = require('../../../service/yield-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');

class ApySeeder {
  static __active = false;

  static async run() {
    // Find all missing seasons
    let missingSeasons = await YieldService.findMissingSeasons();
    if (missingSeasons.length > 0) {
      await SiloService.updateWhitelistedTokenInfo();
    }

    // Calculate and save all vapys for each season (this will take a long time for many seasons)
    const TAG = Concurrent.tag('apySeeder');
    for (const season of missingSeasons) {
      await Concurrent.run(TAG, 5, async () => {
        try {
          await YieldService.saveSeasonalApys({ season });
        } catch (e) {
          Log.info(`Could not save apy for season ${season}`, e);
          throw e;
        }
      });
    }
    await Concurrent.allSettled(TAG);
  }
}
module.exports = ApySeeder;
