const { TRACTOR_SNAPSHOT_SOW_TABLE } = require('../../../constants/tables');
const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorSnapshotSow = sequelize.define(
    'TractorSnapshotSow',
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
      // Cumulative pinto sown across all executions
      ...bigintNumericColumn('totalPintoSown', DataTypes, { allowNull: false }),
      // Cumulative pods minted across all executions
      ...bigintNumericColumn('totalPodsMinted', DataTypes, { allowNull: false }),
      // For orders that can be executed at the current temp
      ...bigintNumericColumn('totalCascadeFundedBelowTemp', DataTypes, { allowNull: false }),
      // For orders that can be executed at any temp
      ...bigintNumericColumn('totalCascadeFundedAnyTemp', DataTypes, { allowNull: false }),
      // Maximum amount that can be sown this season - considers funding, maxSow settings, and the temperature
      ...bigintNumericColumn('maxSowThisSeason', DataTypes, { allowNull: false }),
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
      tableName: TRACTOR_SNAPSHOT_SOW_TABLE.env
    }
  );

  return TractorSnapshotSow;
};
