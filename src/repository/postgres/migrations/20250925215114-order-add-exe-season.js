'use strict';

const { TRACTOR_ORDER_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TRACTOR_ORDER_TABLE.prod, 'lastExecutableSeason', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(TRACTOR_ORDER_TABLE.prod, 'lastExecutableSeason');
  }
};
