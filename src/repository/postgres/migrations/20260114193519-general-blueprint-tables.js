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

    await queryInterface.sequelize.query(`
      ALTER TYPE public."enum_tractor_order_convert_up_v0_lowStalkDeposits"
      RENAME TO "enum_tractor_order_convert_up_lowStalkDeposits";
    `);

    // Add referralAddress column to tractor_order_sow
    await queryInterface.addColumn('tractor_order_sow', 'referralAddress', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove referralAddress column from tractor_order_sow before renaming
    await queryInterface.removeColumn('tractor_order_sow', 'referralAddress');

    // Revert table names by adding _v0 suffix back
    await queryInterface.renameTable('tractor_execution_sow', 'tractor_execution_sow_v0');
    await queryInterface.renameTable('tractor_execution_convert_up', 'tractor_execution_convert_up_v0');
    await queryInterface.renameTable('tractor_order_sow', 'tractor_order_sow_v0');
    await queryInterface.renameTable('tractor_order_convert_up', 'tractor_order_convert_up_v0');
    await queryInterface.renameTable('tractor_snapshot_sow', 'tractor_snapshot_sow_v0');
    await queryInterface.renameTable('tractor_snapshot_convert_up', 'tractor_snapshot_convert_up_v0');

    await queryInterface.sequelize.query(`
      ALTER TYPE public."enum_tractor_order_convert_up_lowStalkDeposits"
      RENAME TO "enum_tractor_order_convert_up_v0_lowStalkDeposits";
    `);
  }
};
