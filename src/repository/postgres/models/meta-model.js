const { API_META_TABLE } = require('../../../constants/tables');

module.exports = (sequelize, DataTypes) => {
  const Meta = sequelize.define(
    'Meta',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      chain: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastDepositUpdate: {
        type: DataTypes.INTEGER
      },
      lastLambdaBdvs: {
        type: DataTypes.TEXT
      },
      lastTractorUpdate: {
        type: DataTypes.INTEGER
      },
      lastInflowUpdate: {
        type: DataTypes.INTEGER
      }
    },
    {
      tableName: API_META_TABLE.env,
      indexes: [
        {
          unique: true,
          fields: ['chain']
        }
      ]
    }
  );

  return Meta;
};
