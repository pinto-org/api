'use strict';

const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_execution_sow_v0', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        references: {
          model: 'tractor_execution',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      blueprintHash: {
        type: Sequelize.STRING(66),
        references: {
          model: 'tractor_order_sow_v0',
          key: 'blueprintHash'
        },
        onDelete: 'RESTRICT',
        allowNull: false
      },
      ...bigintNumericColumn('index', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('pods', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('placeInLine', Sequelize, { allowNull: false }),
      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      usedTokenIndices: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('usedGrownStalkPerBdv', Sequelize, { allowNull: false }),
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('tractor_execution_sow_v0', ['blueprintHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_execution_sow_v0');
  }
};
