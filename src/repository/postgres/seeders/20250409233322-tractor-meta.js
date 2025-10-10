'use strict';

const EnvUtil = require('../../../utils/env');
const { API_META_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!EnvUtil.isChainEnabled('base')) {
      console.log(`Skipping seeder: chain 'base' is not enabled.`);
      return;
    }

    const existingMeta = await queryInterface.sequelize.query(
      `SELECT * FROM "${API_META_TABLE.env}" WHERE chain = :chain`,
      {
        replacements: { chain: 'base' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (existingMeta.length === 0) {
      await queryInterface.bulkInsert(API_META_TABLE.env, [
        {
          chain: 'base',
          lastTractorUpdate: 29114231,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } else {
      await queryInterface.bulkUpdate(API_META_TABLE.env, { lastTractorUpdate: 29114231 }, { lastTractorUpdate: null });
    }
  },

  down: async (queryInterface, Sequelize) => {
    if (EnvUtil.isChainEnabled('base')) {
      await queryInterface.bulkUpdate(API_META_TABLE.env, { lastTractorUpdate: null }, {});
    }
  }
};
