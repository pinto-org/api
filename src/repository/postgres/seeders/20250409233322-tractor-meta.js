'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastTractorUpdate: 29064231 }, { lastTractorUpdate: null });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastTractorUpdate: null }, {});
  }
};
