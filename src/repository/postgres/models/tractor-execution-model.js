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
        type: DataTypes.STRING(42),
        allowNull: false
      },
      // Gas cost of this tractor execution
      gasCostUsd: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      // Will only price the tip if it was paid in bean
      tipUsd: {
        type: DataTypes.FLOAT,
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
        type: DataTypes.STRING(66),
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
