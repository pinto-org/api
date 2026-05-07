const { C } = require('../../../constants/runtime-constants');
const FilterLogs = require('../../../datasources/events/filter-logs');
const SeasonRepository = require('../queries/season-repository');
const SeasonService = require('../../../service/season-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');
const retryable = require('../../../utils/async/retryable');

const SUNRISE_LOG_CHUNK_SIZE = 500000;

class SeasonSeeder {
  static __active = false;

  static async run() {
    // Find all missing seasons
    const missingSeasons = await SeasonService.findMissingSeasons();

    if (missingSeasons.length > 0) {
      Log.info(`Found ${missingSeasons.length} missing seasons`);
    }
    if (missingSeasons.length === 0) {
      return;
    }

    const maxSeasonBlock = await SeasonRepository.getMaxSeasonBlock();
    const fromBlock = maxSeasonBlock ? maxSeasonBlock + 1 : (C().MILESTONE.startSeasonBlock ?? 22622961);
    const sunriseEvents = await this.getSunriseEvents(fromBlock);
    const sunriseBySeason = sunriseEvents.reduce((acc, event) => {
      acc.set(Number(event.args.season), event);
      return acc;
    }, new Map());
    const missingWithoutBoundedEvent = [];

    for (const season of missingSeasons) {
      const event = sunriseBySeason.get(season);
      if (!event) {
        missingWithoutBoundedEvent.push(season);
        continue;
      }

      await SeasonService.handleSunrise(event);
      if (season % 100 === 0) {
        Log.info(`Saved season ${season}...`);
      }
    }

    const TAG = Concurrent.tag('seasonSeeder');
    for (const season of missingWithoutBoundedEvent) {
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

  static async getSunriseEvents(fromBlock, toBlock = 'latest') {
    const resolvedToBlock = toBlock === 'latest' ? (await C().RPC.getBlock()).number : toBlock;
    const events = [];

    for (let chunkFrom = fromBlock; chunkFrom <= resolvedToBlock; chunkFrom += SUNRISE_LOG_CHUNK_SIZE + 1) {
      events.push(
        ...(await FilterLogs.getBeanstalkEvents(['Sunrise'], {
          fromBlock: chunkFrom,
          toBlock: Math.min(chunkFrom + SUNRISE_LOG_CHUNK_SIZE, resolvedToBlock)
        }))
      );
    }

    return events;
  }
}
module.exports = SeasonSeeder;
