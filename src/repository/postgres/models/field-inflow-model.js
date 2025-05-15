const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const FieldInflow = sequelize.define(
    'FieldInflow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // For isMarket=false, sows are positive, harvests are negative
      ...bigintNumericColumn('amount', DataTypes, { allowNull: false }),
      usd: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      isMarket: {
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
      tableName: 'field_inflow'
    }
  );

  return FieldInflow;
};
