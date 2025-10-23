'use strict';

const {
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_SOW_V0_TABLE,
  TRACTOR_ORDER_SOW_V0_TABLE
} = require('../../../constants/tables');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_EXECUTION_SOW_V0_TABLE.prod, {
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
          model: TRACTOR_ORDER_SOW_V0_TABLE.prod,
          key: 'blueprintHash'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      ...bigintNumericColumn('index', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('pods', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('placeInLine', Sequelize, { allowNull: false }),
      usedTokenIndices: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      usedGrownStalkPerBdv: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex(TRACTOR_EXECUTION_SOW_V0_TABLE.prod, ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_EXECUTION_SOW_V0_TABLE.prod);
  }
};
