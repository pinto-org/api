const { SEASON_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const Season = sequelize.define(
    'Season',
    {
      season: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      block: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      sunriseTxn: {
        type: DataTypes.STRING(66),
        allowNull: false
      }
    },
    {
      tableName: SEASON_TABLE.env
    }
  );

  return Season;
};
