'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ApiMeta',
      { lastTractorUpdate: 5000 }, // TODO: update on PI-8 deploy
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ApiMeta', { lastTractorUpdate: null }, {});
  }
};
