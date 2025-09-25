const { TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

// TODO: when taking the snapshots, regarding the max seasonal amount, it will be important
// to check against what the max grown stalk reward will be for the season. This is probably
// also the case more generally when considering how much of an order is funded.
// Should each order track a boolean indicating whether it can be executed this season?

module.exports = (sequelize, DataTypes) => {
  const TractorSnapshotConvertUpV0 = sequelize.define(
    'TractorSnapshotConvertUpV0',
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

      // Unclear how to measure an amount of queued/executable orders per season, since there are multiple unrelated conditions that
      // change independently as those orders execute (price, bonus capacity). Would be possible to queue based
      // on the stalk bonus and assume a constant price.

      // For orders that are funded for execution under any conditions
      ...bigintNumericColumn('totalCascadeFunded', DataTypes, { allowNull: false }),
      // This field can be reintroduced if we also track on the order level what orders can be executed each season
      // The same can be done for the sowing blueprint.
      // // For orders that are funded for execution under current conditions
      // ...bigintNumericColumn('totalCascadeFundedExecutable', DataTypes, { allowNull: false }),
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
      tableName: TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.env
    }
  );

  return TractorSnapshotConvertUpV0;
};
