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

      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      usedTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // uint256[], indices corresponding to usedTokenIndices. Amount of tokens convert from
      tokenFromAmounts: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // uint256[], indices corresponding to usedTokenIndices. Amount of tokens convert to
      tokenToAmounts: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // Amount of bdv converted, equal to the sum of tokenToAmounts (Bean denominated)
      ...bigintNumericColumn('bdvConverted', DataTypes, { allowNull: false }),
      // Non-manipulation resistant prices as of end of block values. Not intrablock safe.
      // Note that the convert execution conditions consider the manipulation resistant prices instead.
      beanPriceBefore: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      beanPriceAfter: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      // Amount of grown stalk bonus awarded to this execution
      ...bigintNumericColumn('gsBonusGained', DataTypes, { allowNull: false }),
      // Amount of bdv that was awarded a grown stalk bonus
      ...bigintNumericColumn('gsBonusBdv', DataTypes, { allowNull: false })
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
