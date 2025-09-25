'use strict';

const { TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE } = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.prod, {
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
      season: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('totalBeansConverted', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalGsBonusStalk', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalGsBonusBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalGsPenaltyStalk', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalGsPenaltyBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalCascadeFunded', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('totalTipsPaid', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('currentMaxTip', Sequelize, { allowNull: false }),
      totalExecutions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      uniquePublishers: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.prod);
  }
};
