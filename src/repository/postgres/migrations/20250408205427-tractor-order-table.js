'use strict';

const { TractorOrderType } = require('../models/types/types');
const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tractor_order', {
      blueprintHash: {
        type: Sequelize.STRING(66),
        primaryKey: true
      },
      orderType: {
        type: Sequelize.ENUM,
        values: Object.values(TractorOrderType),
        allowNull: true
      },
      publisher: {
        type: Sequelize.STRING(42),
        allowNull: false
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      operatorPasteInstrs: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('maxNonce', Sequelize, { allowNull: false }),
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      signature: {
        type: Sequelize.STRING(132),
        allowNull: false
      },
      // Timestamp/block number of when this blueprint was published
      publishedTimestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      publishedBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('beanTip', Sequelize, { allowNull: true }),
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('tractor_order', ['orderType']);
    await queryInterface.addIndex('tractor_order', ['publisher']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tractor_order');
  }
};
