'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tractor_snapshot_sow_v0', 'maxSowThisSeason', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false
    });
    await queryInterface.addColumn('tractor_snapshot_sow_v0', 'uniquePublishers', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tractor_snapshot_sow_v0', 'maxSowThisSeason');
    await queryInterface.removeColumn('tractor_snapshot_sow_v0', 'uniquePublishers');
  }
};
