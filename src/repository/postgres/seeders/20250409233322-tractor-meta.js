'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ApiMeta',
      { lastTractorUpdate: 5000 }, // TODO
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastTractorUpdate: null }, {});
  }
};
