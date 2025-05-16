'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastFieldInflowUpdate: 22622961 }, { lastFieldInflowUpdate: null });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastFieldInflowUpdate: null }, {});
  }
};
