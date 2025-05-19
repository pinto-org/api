'use strict';

const { TRACTOR_SNAPSHOT_SOW_V0_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TRACTOR_SNAPSHOT_SOW_V0_TABLE.prod, 'maxSowThisSeason', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false
    });
    await queryInterface.addColumn(TRACTOR_SNAPSHOT_SOW_V0_TABLE.prod, 'uniquePublishers', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(TRACTOR_SNAPSHOT_SOW_V0_TABLE.prod, 'maxSowThisSeason');
    await queryInterface.removeColumn(TRACTOR_SNAPSHOT_SOW_V0_TABLE.prod, 'uniquePublishers');
  }
};
