const { bigintNumericColumn } = require('../util/sequelize-util');
const { TractorOrderType } = require('./types/types');

module.exports = (sequelize, DataTypes) => {
  const TractorOrder = sequelize.define(
    'TractorOrder',
    {
      blueprintHash: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      orderType: {
        type: DataTypes.ENUM,
        values: Object.values(TractorOrderType),
        allowNull: false
      },
      publisher: {
        type: DataTypes.STRING,
        allowNull: false
      },
      numExecutions: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      data: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // abi encoded bytes32[]
      operatorPasteInstrs: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('maxNonce', DataTypes, { allowNull: false }),
      // TODO: will need special handling for start/end time to accommodate excessively large/out of range values
      // which could be emitted onchain outside of the typical ui flow
      startTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // Timestamp/block number of when this blueprint was published
      publishedTimestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      publishedBlock: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // Amount of tip in beans (if applicable).
      // Tips aren't required or guaranteed to be in bean, but should be in practice.
      ...bigintNumericColumn('beanTip', DataTypes, { allowNull: true })
    },
    {
      tableName: 'tractor_order',
      indexes: [
        {
          fields: ['orderType']
        },
        {
          fields: ['publisher']
        }
      ]
    }
  );

  return TractorOrder;
};
