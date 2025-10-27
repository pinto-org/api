const { FIELD_INFLOW_SNAPSHOT_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const FieldInflowSnapshot = sequelize.define(
    'FieldInflowSnapshot',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshotTimestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      snapshotBlock: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      season: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // cumulative: the overall sum of beans/usd
      // cumulativeProtocol: accounting for negations from opposite silo actions
      ...bigintNumericColumn('cumulativeBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansOut', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeProtocolBeansOut', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansOut', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaProtocolBeansOut', DataTypes, { allowNull: false }),
      cumulativeUsdNet: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      cumulativeUsdIn: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      cumulativeUsdOut: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdNet: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdIn: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      cumulativeProtocolUsdOut: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaUsdNet: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaUsdIn: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaUsdOut: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdNet: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdIn: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaProtocolUsdOut: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      tableName: FIELD_INFLOW_SNAPSHOT_TABLE.env,
      indexes: [
        {
          unique: true,
          fields: ['season']
        }
      ]
    }
  );

  return FieldInflowSnapshot;
};
