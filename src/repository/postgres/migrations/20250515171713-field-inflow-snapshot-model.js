'use strict';

const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('field_inflow_snapshot', {
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
      ...bigintNumericColumn('cumulativeBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansOut', Sequelize, { allowNull: false }),
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
    await queryInterface.dropTable('field_inflow_snapshot');
  }
};
