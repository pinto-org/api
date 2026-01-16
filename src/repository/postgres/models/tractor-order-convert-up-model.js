const { TRACTOR_ORDER_CONVERT_UP_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');
const { StalkMode, TractorOrderConvertUpBlueprintVersion } = require('./types/types');

module.exports = (sequelize, DataTypes) => {
  const TractorOrderConvertUp = sequelize.define(
    'TractorOrderConvertUp',
    {
      blueprintHash: {
        type: DataTypes.STRING(66),
        primaryKey: true
      },
      blueprintVersion: {
        type: DataTypes.ENUM,
        values: Object.values(TractorOrderConvertUpBlueprintVersion),
        allowNull: false
      },
      /* Order state */
      lastExecutedTimestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('beansLeftToConvert', DataTypes, { allowNull: false }),
      orderComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      // Amount that is funded to be executed now (as of the last update). i.e. 10k order but 5k is available
      ...bigintNumericColumn('amountFunded', DataTypes, { allowNull: false }),
      // Actual amount funded when considering potential cascading execution of other blueprints by the same publisher
      ...bigintNumericColumn('cascadeAmountFunded', DataTypes, { allowNull: false }),
      /* Order information */
      // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
      sourceTokenIndices: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      ...bigintNumericColumn('totalBeanAmountToConvert', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minBeansConvertPerExecution', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxBeansConvertPerExecution', DataTypes, { allowNull: false }),
      capAmountToBonusCapacity: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      ...bigintNumericColumn('minTimeBetweenConverts', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minConvertBonusCapacity', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('grownStalkPerBdvBonusBid', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxPriceToConvertUp', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minPriceToConvertUp', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('seedDifference', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdvPenalty', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('slippageRatio', DataTypes, { allowNull: false }),
      lowStalkDeposits: {
        type: DataTypes.ENUM,
        values: Object.values(StalkMode),
        allowNull: false
      }
    },
    {
      tableName: TRACTOR_ORDER_CONVERT_UP_TABLE.env
    }
  );

  // Associations here
  TractorOrderConvertUp.associate = (models) => {
    TractorOrderConvertUp.belongsTo(models.TractorOrder, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorOrderConvertUp;
};
