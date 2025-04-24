'use strict';

const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_snapshot_sow_v0', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshotTimestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      snapshotBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('totalPintoSown', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalCascadeFundedBelowTemp', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalCascadeFundedAnyTemp', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalTipsPaid', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('currentMaxTip', Sequelize, { allowNull: false }),
      totalExecutions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_snapshot_sow_v0');
  }
};
