'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename tables by removing _v0 suffix
    await queryInterface.renameTable('tractor_execution_sow_v0', 'tractor_execution_sow');
    await queryInterface.renameTable('tractor_execution_convert_up_v0', 'tractor_execution_convert_up');
    await queryInterface.renameTable('tractor_order_sow_v0', 'tractor_order_sow');
    await queryInterface.renameTable('tractor_order_convert_up_v0', 'tractor_order_convert_up');
    await queryInterface.renameTable('tractor_snapshot_sow_v0', 'tractor_snapshot_sow');
    await queryInterface.renameTable('tractor_snapshot_convert_up_v0', 'tractor_snapshot_convert_up');
  },

  async down(queryInterface, Sequelize) {
    // Revert table names by adding _v0 suffix back
    await queryInterface.renameTable('tractor_execution_sow', 'tractor_execution_sow_v0');
    await queryInterface.renameTable('tractor_execution_convert_up', 'tractor_execution_convert_up_v0');
    await queryInterface.renameTable('tractor_order_sow', 'tractor_order_sow_v0');
    await queryInterface.renameTable('tractor_order_convert_up', 'tractor_order_convert_up_v0');
    await queryInterface.renameTable('tractor_snapshot_sow', 'tractor_snapshot_sow_v0');
    await queryInterface.renameTable('tractor_snapshot_convert_up', 'tractor_snapshot_convert_up_v0');
  }
};
