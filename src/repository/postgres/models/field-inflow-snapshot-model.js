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
      ...bigintNumericColumn('cumulativeBeans', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBeans', DataTypes, { allowNull: false }),
      cumulativeUsd: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      deltaUsd: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      tableName: 'field_inflow_snapshot'
    }
  );

  return FieldInflowSnapshot;
};
