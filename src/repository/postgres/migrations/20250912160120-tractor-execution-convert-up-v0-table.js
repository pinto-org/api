'use strict';

const {
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE,
  TRACTOR_ORDER_CONVERT_UP_V0_TABLE
} = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.prod, {
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
          model: TRACTOR_ORDER_CONVERT_UP_V0_TABLE.prod,
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

    await queryInterface.addIndex(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.prod, ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.prod);
  }
};
