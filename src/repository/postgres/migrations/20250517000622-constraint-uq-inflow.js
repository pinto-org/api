'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('truncate table silo_inflow_snapshot cascade');
    await queryInterface.sequelize.query('truncate table field_inflow_snapshot cascade');

    await queryInterface.addConstraint('silo_inflow_snapshot', {
      fields: ['season'],
      type: 'unique',
      name: 'silo_inflow_snapshot_season_ukey'
    });
    await queryInterface.addConstraint('field_inflow_snapshot', {
      fields: ['season'],
      type: 'unique',
      name: 'field_inflow_snapshot_season_ukey'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('silo_inflow_snapshot', 'silo_inflow_snapshot_season_ukey');
    await queryInterface.removeConstraint('field_inflow_snapshot', 'field_inflow_snapshot_season_ukey');
  }
};
