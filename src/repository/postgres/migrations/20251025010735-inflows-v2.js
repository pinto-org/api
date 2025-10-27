'use strict';

const {
  SILO_INFLOW_TABLE,
  FIELD_INFLOW_TABLE,
  SILO_INFLOW_SNAPSHOT_TABLE,
  FIELD_INFLOW_SNAPSHOT_TABLE,
  API_META_TABLE
} = require('../../../constants/tables');
const { bigintNumericColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop and recreate the table; reindexing is required upon this upgrade (meta progress also resets).
    await queryInterface.dropTable(SILO_INFLOW_TABLE.prod);
    await queryInterface.dropTable(SILO_INFLOW_SNAPSHOT_TABLE.prod);
    await queryInterface.dropTable(FIELD_INFLOW_TABLE.prod);
    await queryInterface.dropTable(FIELD_INFLOW_SNAPSHOT_TABLE.prod);

    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastSiloInflowUpdate');
    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate');
    await queryInterface.addColumn(API_META_TABLE.prod, 'lastInflowUpdate', {
      type: Sequelize.INTEGER
    });

    await queryInterface.createTable(SILO_INFLOW_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('amount', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('bdv', Sequelize, { allowNull: false }),
      usd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      isLp: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      isTransfer: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      isPlenty: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      /// These are the new columns
      ...bigintNumericColumn('accountFieldNegationBdv', Sequelize, { allowNull: false }),
      accountFieldNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...bigintNumericColumn('protocolFieldNegationBdv', Sequelize, { allowNull: false }),
      protocolFieldNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ///
      block: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      txnHash: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.createTable(SILO_INFLOW_SNAPSHOT_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshotTimestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      snapshotBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      season: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('cumulativeBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBdvOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBdvNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBdvIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBdvOut', Sequelize, { allowNull: false }),
      cumulativeUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
    await queryInterface.addConstraint(SILO_INFLOW_SNAPSHOT_TABLE.prod, {
      fields: ['season'],
      type: 'unique',
      name: 'silo_inflow_snapshot_season_ukey'
    });

    await queryInterface.createTable(FIELD_INFLOW_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
      usd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      isMarket: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      /// These are the new columns
      ...bigintNumericColumn('accountSiloNegationBdv', Sequelize, { allowNull: false }),
      accountSiloNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...bigintNumericColumn('protocolSiloNegationBdv', Sequelize, { allowNull: false }),
      protocolSiloNegationUsd: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ///
      block: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      txnHash: {
        type: Sequelize.STRING(66),
        allowNull: false
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.createTable(FIELD_INFLOW_SNAPSHOT_TABLE.prod, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshotTimestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      snapshotBlock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      season: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('cumulativeBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansOut', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansNet', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansIn', Sequelize, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansOut', Sequelize, { allowNull: false }),
      cumulativeUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdNet: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdIn: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdOut: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      ...timestamps(Sequelize)
    });
    await queryInterface.addConstraint(FIELD_INFLOW_SNAPSHOT_TABLE.prod, {
      fields: ['season'],
      type: 'unique',
      name: 'field_inflow_snapshot_season_ukey'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(SILO_INFLOW_TABLE.prod);
    await queryInterface.dropTable(SILO_INFLOW_SNAPSHOT_TABLE.prod);
    await queryInterface.dropTable(FIELD_INFLOW_TABLE.prod);
    await queryInterface.dropTable(FIELD_INFLOW_SNAPSHOT_TABLE.prod);

    await queryInterface.removeColumn(API_META_TABLE.prod, 'lastInflowUpdate');
    await queryInterface.addColumn(API_META_TABLE.prod, 'lastSiloInflowUpdate', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn(API_META_TABLE.prod, 'lastFieldInflowUpdate', {
      type: Sequelize.INTEGER
    });
  }
};
