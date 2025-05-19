'use strict';

const { SILO_INFLOW_SNAPSHOT_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(SILO_INFLOW_SNAPSHOT_TABLE.prod, {
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
      ...bigintNumericColumn('cumulativeBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdv', Sequelize, { allowNull: false }),
      cumulativeUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(SILO_INFLOW_SNAPSHOT_TABLE.prod);
  }
};
