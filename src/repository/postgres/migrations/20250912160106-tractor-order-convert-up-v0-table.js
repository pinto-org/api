'use strict';

const { TRACTOR_ORDER_TABLE, TRACTOR_ORDER_CONVERT_UP_V0_TABLE } = require('../../../constants/tables');
const { StalkMode } = require('../models/types/types');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_ORDER_CONVERT_UP_V0_TABLE.prod, {
      blueprintHash: {
        type: Sequelize.STRING(66),
        primaryKey: true,
        references: {
          model: TRACTOR_ORDER_TABLE.prod,
          key: 'blueprintHash'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      lastExecutedTimestamp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('beansLeftToConvert', Sequelize, { allowNull: false }),
      orderComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      ...bigintNumericColumn('amountFunded', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cascadeAmountFunded', Sequelize, { allowNull: false }),
      sourceTokenIndices: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('totalBeanAmountToConvert', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minBeansConvertPerExecution', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxBeansConvertPerExecution', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minTimeBetweenConverts', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minConvertBonusCapacity', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('grownStalkPerBdvBonusBid', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxPriceToConvertUp', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minPriceToConvertUp', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdvPenalty', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('slippageRatio', Sequelize, { allowNull: false }),
      lowStalkDeposits: {
        type: Sequelize.ENUM,
        values: Object.values(StalkMode),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_ORDER_CONVERT_UP_V0_TABLE.prod);
  }
};
