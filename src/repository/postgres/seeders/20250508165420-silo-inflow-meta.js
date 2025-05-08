'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastSiloInflowUpdate: 22622961 }, { lastSiloInflowUpdate: null });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastSiloInflowUpdate: null }, {});
  }
};
