'use strict';

const { FIELD_INFLOW_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(FIELD_INFLOW_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
      usd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      isMarket: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      ...bigintNumericColumn('accountSiloNegationBdv', Sequelize, { allowNull: false }),
      accountSiloNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...bigintNumericColumn('protocolSiloNegationBdv', Sequelize, { allowNull: false }),
      protocolSiloNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      block: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      txnHash: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(FIELD_INFLOW_TABLE.prod);
  }
};
