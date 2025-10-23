'use strict';

const { TOKEN_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(TOKEN_TABLE.prod, 'token', 'address');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(TOKEN_TABLE.prod, 'address', 'token');
  }
};
