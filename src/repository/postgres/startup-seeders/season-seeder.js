const SeasonService = require('../../../service/season-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');
const retryable = require('../../../utils/async/retryable');

class SeasonSeeder {
  static __active = false;

  static async run() {
    // Find all missing seasons
    const missingSeasons = await SeasonService.findMissingSeasons();

    if (missingSeasons.length > 0) {
      Log.info(`Found ${missingSeasons.length} missing seasons`);
    }

    // Identify corresponding onchain season events
    const TAG = Concurrent.tag('seasonSeeder');
    for (const season of missingSeasons) {
      await Concurrent.run(TAG, 50, () =>
        retryable(async () => {
          try {
            await SeasonService.insertSeason(season);

            if (season % 100 === 0) {
              Log.info(`Saved season ${season}...`);
            }
          } catch (e) {
            Log.info(`Could not get info for season ${season}`, e);
            throw e;
          }
        })
      );
    }
    await Concurrent.allSettled(TAG);
  }
}
module.exports = SeasonSeeder;
