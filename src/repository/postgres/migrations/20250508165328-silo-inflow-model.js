'use strict';

const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('silo_inflow', {
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
        type: DataTypes.BOOLEAN,
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
    await queryInterface.dropTable('silo_inflow');
  }
};
