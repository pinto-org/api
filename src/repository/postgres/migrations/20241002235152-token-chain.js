'use strict';

const { TOKEN_TABLE } = require('../../../constants/tables');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TOKEN_TABLE.prod, 'chain', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'eth'
    });

    await queryInterface.addColumn(TOKEN_TABLE.prod, 'supply', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false,
      defaultValue: '0'
    });

    // Remove the default values so future inserts don't automatically use it
    await queryInterface.changeColumn(TOKEN_TABLE.prod, 'chain', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn(TOKEN_TABLE.prod, 'supply', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false
    });

    // Update unique index to be on (chain, supply)
    await queryInterface.removeConstraint(TOKEN_TABLE.prod, 'token_token_key');
    await queryInterface.addConstraint(TOKEN_TABLE.prod, {
      fields: ['address', 'chain'],
      type: 'unique',
      name: 'token_address_chain_ukey'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(TOKEN_TABLE.prod, 'token_address_chain_ukey');
    await queryInterface.addConstraint(TOKEN_TABLE.prod, {
      fields: ['address'],
      type: 'unique',
      name: 'token_token_key'
    });

    await queryInterface.removeColumn(TOKEN_TABLE.prod, 'chain');
    await queryInterface.removeColumn(TOKEN_TABLE.prod, 'supply');
  }
};
