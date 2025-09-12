const { TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorExecutionConvertUpV0 = sequelize.define(
    'TractorExecutionConvertUpV0',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      /// TractorOrderConvertUpV0 blueprintHash added via association below ///

      // price before
      // price after
      // bdv before
      // bdv after
      // grown stalk bonus gained
      // bdv used towards gs bonus
      //? amount of bdv that the gs bonus applied to

      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      usedTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.env,
      indexes: [
        {
          fields: ['blueprintHash']
        }
      ]
    }
  );

  // Associations here
  TractorExecutionConvertUpV0.associate = (models) => {
    TractorExecutionConvertUpV0.belongsTo(models.TractorExecution, { foreignKey: 'id', onDelete: 'RESTRICT' });
    TractorExecutionConvertUpV0.belongsTo(models.TractorOrderConvertUpV0, {
      foreignKey: 'blueprintHash',
      onDelete: 'RESTRICT'
    });
  };

  return TractorExecutionConvertUpV0;
};
