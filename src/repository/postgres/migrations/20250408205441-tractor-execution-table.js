'use strict';

const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_execution', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blueprintHash: {
        type: Sequelize.STRING(66),
        references: {
          model: 'tractor_order',
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
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tipUsd: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('tractor_execution', ['operator']);
    await queryInterface.addIndex('tractor_execution', ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_execution');
  }
};
