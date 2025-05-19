'use strict';

const { SEASON_TABLE } = require('../../../constants/tables');
const { timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(SEASON_TABLE.prod, {
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
    await queryInterface.dropTable(SEASON_TABLE.prod);
  }
};
