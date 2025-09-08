const AppMetaService = require('../../../service/meta-service');
const Log = require('../../../utils/logging');
const ApySeeder = require('./apy-seeder');
const DepositSeeder = require('./deposit-seeder');
const DevSeeder = require('./dev-seeder');
const SeasonSeeder = require('./season-seeder');

const SEEDERS = [DevSeeder, DepositSeeder, SeasonSeeder, ApySeeder];
let progress = 0;

// For seeding the database during api uptime, ideal for longer running seeds.
class StartupSeeder {
  static async seedDatabase() {
    // Initialize db meta
    await AppMetaService.init();

    for (let i = 0; i < SEEDERS.length; ++i) {
      Log.info(`Running seeder [${progress}]...`);
      try {
        SEEDERS[i].__active = true;
        await SEEDERS[i].run();
      } finally {
        SEEDERS[i].__active = false;
      }
      ++progress;
    }
    Log.info(`Completed all seeders`);
  }

  static isSeeded(seeder) {
    const index = SEEDERS.indexOf(seeder);
    if (index === -1) {
      throw new Error('The provided object was not a Seeder.');
    }
    return progress > index;
  }
}
module.exports = StartupSeeder;
