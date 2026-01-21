const { TRACTOR_EXECUTION_SOW_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorExecutionSow = sequelize.define(
    'TractorExecutionSow',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      /// TractorOrderSow blueprintHash added via association below ///
      ...bigintNumericColumn('index', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('beans', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('pods', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('placeInLine', DataTypes, { allowNull: false }),
      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      usedTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      usedGrownStalkPerBdv: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      referrer: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ...bigintNumericColumn('referrerPods', DataTypes, { allowNull: true }),
      ...bigintNumericColumn('referrerPlaceInLine', DataTypes, { allowNull: true }),
      ...bigintNumericColumn('refereePods', DataTypes, { allowNull: true }),
      ...bigintNumericColumn('refereePlaceInLine', DataTypes, { allowNull: true })
    },
    {
      tableName: TRACTOR_EXECUTION_SOW_TABLE.env,
      indexes: [
        {
          fields: ['blueprintHash']
        }
      ]
    }
  );

  // Associations here
  TractorExecutionSow.associate = (models) => {
    TractorExecutionSow.belongsTo(models.TractorExecution, { foreignKey: 'id', onDelete: 'RESTRICT' });
    TractorExecutionSow.belongsTo(models.TractorOrderSow, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorExecutionSow;
};
