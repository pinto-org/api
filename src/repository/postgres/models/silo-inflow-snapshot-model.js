const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const SiloInflowSnapshot = sequelize.define(
    'SiloInflowSnapshot',
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
      ...bigintNumericColumn('cumulativeBdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBdv', DataTypes, { allowNull: false }),
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
      tableName: 'silo_inflow_snapshot'
    }
  );

  return SiloInflowSnapshot;
};
