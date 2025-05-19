const { SILO_INFLOW_SNAPSHOT_TABLE } = require('../../../constants/tables');
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
      ...bigintNumericColumn('cumulativeBdvNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('cumulativeBdvOut', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvNet', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvIn', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('deltaBdvOut', DataTypes, { allowNull: false }),
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
      tableName: SILO_INFLOW_SNAPSHOT_TABLE.env,
      indexes: [
        {
          unique: true,
          fields: ['season']
        }
      ]
    }
  );

  // Association here is necessary for Sequelize to join the two tables in InflowRepository.
  SiloInflowSnapshot.hasOne(sequelize.models.FieldInflowSnapshot, {
    sourceKey: 'season',
    foreignKey: 'season',
    constraints: false // disables actual FK constraint in DB
  });

  return SiloInflowSnapshot;
};
