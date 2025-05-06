'use strict';

const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('season', {
      season: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      block: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      sunriseTxn: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('season');
  }
};
