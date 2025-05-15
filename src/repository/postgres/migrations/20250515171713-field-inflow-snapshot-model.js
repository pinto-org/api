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
      ...bigintNumericColumn('cumulativeBeans', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeans', Sequelize, { allowNull: false }),
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
    await queryInterface.dropTable('field_inflow_snapshot');
  }
};
