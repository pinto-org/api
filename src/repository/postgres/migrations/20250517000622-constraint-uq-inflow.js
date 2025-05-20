'use strict';

const { FIELD_INFLOW_SNAPSHOT_TABLE, SILO_INFLOW_SNAPSHOT_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`truncate table ${SILO_INFLOW_SNAPSHOT_TABLE.prod} cascade`);
    await queryInterface.sequelize.query(`truncate table ${FIELD_INFLOW_SNAPSHOT_TABLE.prod} cascade`);

    await queryInterface.addConstraint(SILO_INFLOW_SNAPSHOT_TABLE.prod, {
      fields: ['season'],
      type: 'unique',
      name: 'silo_inflow_snapshot_season_ukey'
    });
    await queryInterface.addConstraint(FIELD_INFLOW_SNAPSHOT_TABLE.prod, {
      fields: ['season'],
      type: 'unique',
      name: 'field_inflow_snapshot_season_ukey'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(SILO_INFLOW_SNAPSHOT_TABLE.prod, 'silo_inflow_snapshot_season_ukey');
    await queryInterface.removeConstraint(FIELD_INFLOW_SNAPSHOT_TABLE.prod, 'field_inflow_snapshot_season_ukey');
  }
};
