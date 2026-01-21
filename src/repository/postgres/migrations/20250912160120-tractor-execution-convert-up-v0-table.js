'use strict';

const { TRACTOR_EXECUTION_TABLE } = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_execution_convert_up_v0', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        references: {
          model: TRACTOR_EXECUTION_TABLE.prod,
          key: 'id'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      blueprintHash: {
        type: Sequelize.STRING(66),
        references: {
          model: 'tractor_order_convert_up_v0',
          key: 'blueprintHash'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      usedTokenIndices: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tokenFromAmounts: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tokenToAmounts: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('beansConverted', Sequelize, { allowNull: false }),
      beanPriceBefore: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      beanPriceAfter: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...bigintNumericColumn('gsBonusStalk', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('gsBonusBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('gsPenaltyStalk', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('gsPenaltyBdv', Sequelize, { allowNull: false }),
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('tractor_execution_convert_up_v0', ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_execution_convert_up_v0');
  }
};
