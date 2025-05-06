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
      }
    },
    {
      tableName: 'season'
    }
  );

  return Season;
};
