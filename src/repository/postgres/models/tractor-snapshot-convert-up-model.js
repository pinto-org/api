const { TRACTOR_SNAPSHOT_CONVERT_UP_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorSnapshotConvertUp = sequelize.define(
    'TractorSnapshotConvertUp',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshotTimestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      snapshotBlock: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      season: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // Cumulative beans converted up to across all executions
      ...bigintNumericColumn('totalBeansConverted', DataTypes, { allowNull: false }),
      // Cumulative grown stalk bonus (stalk amount) applied across all executions
      ...bigintNumericColumn('totalGsBonusStalk', DataTypes, { allowNull: false }),
      // Cumulative grown stalk bonus (bdv amount) applied across all executions
      ...bigintNumericColumn('totalGsBonusBdv', DataTypes, { allowNull: false }),
      // Cumulative grown stalk penalty (stalk amount) applied across all executions
      ...bigintNumericColumn('totalGsPenaltyStalk', DataTypes, { allowNull: false }),
      // Cumulative grown stalk penalty (bdv amount) applied across all executions
      ...bigintNumericColumn('totalGsPenaltyBdv', DataTypes, { allowNull: false }),
      // For orders that are funded for execution under any conditions
      ...bigintNumericColumn('totalCascadeFunded', DataTypes, { allowNull: false }),
      // For orders that are funded for execution under current conditions
      ...bigintNumericColumn('totalCascadeFundedExecutable', DataTypes, { allowNull: false }),
      // Cumulative operator rewards
      ...bigintNumericColumn('totalTipsPaid', DataTypes, { allowNull: false }),
      // The current max tip across all orders of this type
      ...bigintNumericColumn('currentMaxTip', DataTypes, { allowNull: false }),
      // Total number of times this order type has been executed
      totalExecutions: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // Total number of unique publishers of this order type
      uniquePublishers: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: TRACTOR_SNAPSHOT_CONVERT_UP_TABLE.env
    }
  );

  return TractorSnapshotConvertUp;
};
