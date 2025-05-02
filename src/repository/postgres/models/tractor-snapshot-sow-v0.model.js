const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const TractorSnapshotSowV0 = sequelize.define(
    'TractorSnapshotSowV0',
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
      // The current max tip across all orders
      ...bigintNumericColumn('currentMaxTip', DataTypes, { allowNull: false }),
      // Total number of times this order type has been executed
      totalExecutions: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // Total number of unique publishers
      uniquePublishers: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: 'tractor_snapshot_sow_v0'
    }
  );

  return TractorSnapshotSowV0;
};
