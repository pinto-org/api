const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const SiloInflow = sequelize.define(
    'SiloInflow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        // TODO: consider how this affects transfers. Is an outflow for the account but not the silo
        type: DataTypes.STRING,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('amount', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('bdv', DataTypes, { allowNull: false }),
      usd: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      isLp: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      block: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      txnHash: {
        type: DataTypes.STRING(66),
        allowNull: false
      }
    },
    {
      tableName: 'silo_inflow'
    }
  );

  return SiloInflow;
};
