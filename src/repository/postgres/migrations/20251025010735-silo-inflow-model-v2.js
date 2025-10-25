'use strict';

const { SILO_INFLOW_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop and recreate the table; reindexing is required upon this upgrade (meta progress also resets).
    await queryInterface.dropTable(SILO_INFLOW_TABLE.prod);

    await queryInterface.createTable(SILO_INFLOW_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('amount', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('bdv', Sequelize, { allowNull: false }),
      usd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      isLp: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      isTransfer: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      isPlenty: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      /// These are the new columns
      ...bigintNumericColumn('accountFieldNegationBdv', Sequelize, { allowNull: false }),
      accountFieldNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...bigintNumericColumn('protocolFieldNegationBdv', Sequelize, { allowNull: false }),
      protocolFieldNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ///
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
    await queryInterface.dropTable(SILO_INFLOW_TABLE.prod);
  }
};
