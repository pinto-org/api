const { TRACTOR_ORDER_CONVERT_UP_V0_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorOrderConvertUpV0 = sequelize.define(
    'TractorOrderConvertUpV0',
    {
      blueprintHash: {
        type: DataTypes.STRING(66),
        primaryKey: true
      },
      /* Order state */
      lastExecutedTimestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('bdvLeftToConvert', DataTypes, { allowNull: false }),
      orderComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      // TODO: consider how to do amount funded/cascade funding amounts
      // Check total BDV user has deposited of the given source tokens.
      // Pull equivalent withdrawl plan as the blueprint but with a huge bdv limit.
      // Check total totalConvertBdv across similar orders
      // But is this bdv deposited or instantaneous?

      /* Order information */
      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      sourceTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('totalConvertBdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minConvertBdvPerExecution', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxConvertBdvPerExecution', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minTimeBetweenConverts', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minConvertBonusCapacity', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minGrownStalkPerBdvBonus', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxPriceToConvertUp', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minPriceToConvertUp', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdvPenalty', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('slippageRatio', DataTypes, { allowNull: false }),
      lowStalkDeposits: {
        type: DataTypes.ENUM,
        values: Object.values(StalkMode),
        allowNull: true
      }
    },
    {
      tableName: TRACTOR_ORDER_CONVERT_UP_V0_TABLE.env
    }
  );

  // Associations here
  TractorOrderConvertUpV0.associate = (models) => {
    TractorOrderConvertUpV0.belongsTo(models.TractorOrder, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorOrderConvertUpV0;
};
