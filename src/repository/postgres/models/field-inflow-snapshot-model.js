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
      ...bigintNumericColumn('cumulativeBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBeansOut', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeansOut', DataTypes, { allowNull: false }),
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
