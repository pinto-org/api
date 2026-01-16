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

    // Create enum type for tractor_order_sow blueprintVersion
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tractor_order_sow_blueprintVersion" AS ENUM ('V0', 'REFERRAL');
    `);

    // Create enum type for tractor_order_convert_up blueprintVersion
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tractor_order_convert_up_blueprintVersion" AS ENUM ('V0');
    `);

    // Add blueprintVersion column to tractor_order_sow
    await queryInterface.sequelize.query(`
      ALTER TABLE "tractor_order_sow"
      ADD COLUMN "blueprintVersion" "enum_tractor_order_sow_blueprintVersion" NOT NULL DEFAULT 'V0';
    `);

    // Add blueprintVersion column to tractor_order_convert_up
    await queryInterface.sequelize.query(`
      ALTER TABLE "tractor_order_convert_up"
      ADD COLUMN "blueprintVersion" "enum_tractor_order_convert_up_blueprintVersion" NOT NULL DEFAULT 'V0';
    `);

    // Add referralAddress column to tractor_order_sow
    await queryInterface.addColumn('tractor_order_sow', 'referralAddress', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns before renaming
    await queryInterface.removeColumn('tractor_order_sow', 'referralAddress');
    await queryInterface.removeColumn('tractor_order_sow', 'blueprintVersion');
    await queryInterface.removeColumn('tractor_order_convert_up', 'blueprintVersion');

    // Drop new enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_tractor_order_sow_blueprintVersion";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_tractor_order_convert_up_blueprintVersion";
    `);

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
