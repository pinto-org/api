'use strict';

const { TRACTOR_EXECUTION_TABLE, TRACTOR_ORDER_TABLE } = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_EXECUTION_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blueprintHash: {
        type: Sequelize.STRING(66),
        references: {
          model: TRACTOR_ORDER_TABLE.prod,
          key: 'blueprintHash'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      ...bigintNumericColumn('nonce', Sequelize, { allowNull: false }),
      operator: {
        type: Sequelize.STRING(42),
        allowNull: false
      },
      gasCostUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      tipUsd: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      executedTimestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      executedBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      executedTxn: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex(TRACTOR_EXECUTION_TABLE.prod, ['operator']);
    await queryInterface.addIndex(TRACTOR_EXECUTION_TABLE.prod, ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_EXECUTION_TABLE.prod);
  }
};
