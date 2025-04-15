const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorOrderSowV0 = sequelize.define(
    'TractorOrderSowV0',
    {
      // TODO: need id referencing regular execution. Should it be same id as execution?
      blueprintHash: {
        type: DataTypes.STRING(66),
        primaryKey: true
      },
      /* Order state */
      ...bigintNumericColumn('pintoSownCounter', DataTypes, { allowNull: false }),
      lastExecutedSeason: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
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
      ...bigintNumericColumn('totalAmountToSow', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minAmountToSowPerSeason', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxAmountToSowPerSeason', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('minTemp', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxPodlineLength', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('maxGrownStalkPerBdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('runBlocksAfterSunrise', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('slippageRatio', DataTypes, { allowNull: false })
    },
    {
      tableName: 'tractor_order_sow_v0'
    }
  );

  // Associations here
  TractorOrderSowV0.associate = (models) => {
    TractorOrderSowV0.belongsTo(models.TractorOrder, { foreignKey: 'blueprintHash', onDelete: 'RESTRICT' });
  };

  return TractorOrderSowV0;
};
