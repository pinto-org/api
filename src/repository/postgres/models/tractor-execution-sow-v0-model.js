const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorExecutionSowV0 = sequelize.define(
    'TractorExecutionSowV0',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      /// TractorOrderSowV0 blueprintHash added via association below ///
      ...bigintNumericColumn('index', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('beans', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('pods', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('placeInLine', DataTypes, { allowNull: false }),
      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      usedTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('usedGrownStalkPerBdv', DataTypes, { allowNull: false })
    },
    {
      tableName: 'tractor_execution_sow_v0',
      indexes: [
        {
          fields: ['blueprintHash']
        }
      ]
    }
  );

  // Associations here
  TractorExecutionSowV0.associate = (models) => {
    TractorExecutionSowV0.belongsTo(models.TractorExecution, { foreignKey: 'id', onDelete: 'RESTRICT' });
    TractorExecutionSowV0.belongsTo(models.TractorOrderSowV0, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorExecutionSowV0;
};
