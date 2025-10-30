'use strict';

const { API_META_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(API_META_TABLE.env, { lastInflowUpdate: 22622961 }, { lastInflowUpdate: null });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(API_META_TABLE.env, { lastInflowUpdate: null }, {});
  }
};
