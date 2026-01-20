'use strict';

const { TRACTOR_ORDER_TABLE } = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_order_sow_v0', {
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
      ...bigintNumericColumn('pintoSownCounter', Sequelize, { allowNull: false }),
      lastExecutedSeason: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
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
      ...bigintNumericColumn('totalAmountToSow', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minAmountToSowPerSeason', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxAmountToSowPerSeason', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('minTemp', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxPodlineLength', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdv', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('runBlocksAfterSunrise', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('slippageRatio', Sequelize, { allowNull: false }),
      ...timestamps(Sequelize)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_order_sow_v0');
  }
};
