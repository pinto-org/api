const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorExecution = sequelize.define(
    'TractorExecution',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      /// TractorOrder blueprintHash added via association below ///
      ...bigintNumericColumn('nonce', DataTypes, { allowNull: false }),
      operator: {
        type: DataTypes.STRING,
        allowNull: false
      },
      gasCostUsd: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      tipUsd: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      executedTimestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      executedBlock: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      executedTxn: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: 'tractor_execution',
      indexes: [
        {
          fields: ['operator']
        },
        {
          fields: ['blueprintHash']
        }
      ]
    }
  );

  // Associations here
  TractorExecution.associate = (models) => {
    TractorExecution.belongsTo(models.TractorOrder, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorExecution;
};
