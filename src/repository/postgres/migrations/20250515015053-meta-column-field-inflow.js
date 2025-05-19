'use strict';

const { API_META_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate', {
      type: Sequelize.INTEGER
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate');
  }
};
