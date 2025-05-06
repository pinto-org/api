const { ethers } = require('ethers');
const FilterLogs = require('../../../datasources/events/filter-logs');
const SeasonService = require('../../../service/season-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');

class SeasonSeeder {
  static async run() {
    // Find all missing seasons
    const missingSeasons = await SeasonService.findMissingSeasons();

    if (missingSeasons.length > 0) {
      Log.info(`Found ${missingSeasons.length} missing seasons`);
    }

    // Identify all onchain season events
    const TAG = Concurrent.tag('seasonSeeder');
    for (const season of missingSeasons) {
      await Concurrent.run(TAG, 50, async () => {
        try {
          await SeasonService.insertSeasonFromEvent(season);

          if (season % 100 === 0) {
            Log.info(`Saved season ${season}...`);
          }
        } catch (e) {
          Log.info(`Could not get info for season ${season}`, e);
          throw e;
        }
      });
    }
    await Concurrent.allSettled(TAG);
  }
}
module.exports = SeasonSeeder;
