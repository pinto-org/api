'use strict';

const { API_META_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastSiloInflowUpdate');
    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate');

    await queryInterface.addColumn(API_META_TABLE.prod, 'lastInflowUpdate', {
      type: Sequelize.INTEGER
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastInflowUpdate');

    await queryInterface.addColumn(API_META_TABLE.prod, 'lastSiloInflowUpdate', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate', {
      type: Sequelize.INTEGER
    });
  }
};
