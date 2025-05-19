'use strict';

const { TRACTOR_ORDER_TABLE } = require('../../../constants/tables');
const { TractorOrderType } = require('../models/types/types');
const { timestamps, bigintNumericColumn, largeBigintTextColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TRACTOR_ORDER_TABLE.prod, {
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
      ...largeBigintTextColumn('maxNonce', Sequelize, { allowNull: false }),
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
      cancelled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex(TRACTOR_ORDER_TABLE.prod, ['orderType']);
    await queryInterface.addIndex(TRACTOR_ORDER_TABLE.prod, ['publisher']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TRACTOR_ORDER_TABLE.prod);
  }
};
