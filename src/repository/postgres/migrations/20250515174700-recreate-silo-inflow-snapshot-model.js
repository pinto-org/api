'use strict';

const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('silo_inflow_snapshot');
    await queryInterface.createTable('silo_inflow_snapshot', {
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
      ...bigintNumericColumn('cumulativeBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvOut', Sequelize, { allowNull: false }),
      cumulativeUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('silo_inflow_snapshot');
  }
};
