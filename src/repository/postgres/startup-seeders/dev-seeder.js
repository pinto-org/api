const { API_META_TABLE } = require('../../../constants/tables');
const TractorTask = require('../../../scheduled/tasks/tractor');
const AsyncContext = require('../../../utils/async/context');
const EnvUtil = require('../../../utils/env');
const Log = require('../../../utils/logging');
const { sequelize } = require('../models');

class DevSeeder {
  static __active = false;

  static async run() {
    if (EnvUtil.getDevTractor().seeder) {
      Log.info('Running Tractor dev seeder');
      await AsyncContext.sequelizeTransaction(async () => {
        await sequelize.query('truncate table tractor_order cascade');
        await sequelize.query('truncate table tractor_snapshot_sow_v0 cascade');
        await sequelize.query('truncate table tractor_snapshot_convert_up_v0 cascade');
        await sequelize.query(
          `update "${API_META_TABLE.env}" set "lastTractorUpdate" = ${EnvUtil.getDevTractor().seedBlock};`
        );
      });

      await AsyncContext.run({ chain: 'base' }, async () => {
        try {
          TractorTask.__cronLock = true;
          while (await TractorTask.update()) {}
        } finally {
          TractorTask.__cronLock = false;
        }
      });
    }
  }
}
module.exports = DevSeeder;
