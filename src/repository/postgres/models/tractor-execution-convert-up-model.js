const { TRACTOR_EXECUTION_CONVERT_UP_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorExecutionConvertUp = sequelize.define(
    'TractorExecutionConvertUp',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      /// TractorOrderConvertUp blueprintHash added via association below ///

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
      ...bigintNumericColumn('beansConverted', DataTypes, { allowNull: false }),
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
      ...bigintNumericColumn('gsBonusStalk', DataTypes, { allowNull: false }),
      // Amount of bdv that was awarded a grown stalk bonus
      ...bigintNumericColumn('gsBonusBdv', DataTypes, { allowNull: false }),
      // Amount of grown stalk penalty applied during this execution. Cannot currently occur
      ...bigintNumericColumn('gsPenaltyStalk', DataTypes, { allowNull: false }),
      // Amount of bdv that was penalized. Cannot currently occur
      ...bigintNumericColumn('gsPenaltyBdv', DataTypes, { allowNull: false })
    },
    {
      tableName: TRACTOR_EXECUTION_CONVERT_UP_TABLE.env,
      indexes: [
        {
          fields: ['blueprintHash']
        }
      ]
    }
  );

  // Associations here
  TractorExecutionConvertUp.associate = (models) => {
    TractorExecutionConvertUp.belongsTo(models.TractorExecution, { foreignKey: 'id', onDelete: 'RESTRICT' });
    TractorExecutionConvertUp.belongsTo(models.TractorOrderConvertUp, {
      foreignKey: 'blueprintHash',
      onDelete: 'RESTRICT'
    });
  };

  return TractorExecutionConvertUp;
};
