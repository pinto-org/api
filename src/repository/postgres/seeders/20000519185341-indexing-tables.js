'use strict';

const {
  API_META_TABLE,
  DEPOSIT_TABLE,
  TRACTOR_ORDER_TABLE,
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_SOW_V0_TABLE,
  TRACTOR_SNAPSHOT_SOW_V0_TABLE,
  TRACTOR_ORDER_SOW_V0_TABLE,
  SILO_INFLOW_TABLE,
  SILO_INFLOW_SNAPSHOT_TABLE,
  FIELD_INFLOW_SNAPSHOT_TABLE,
  FIELD_INFLOW_TABLE,
  TOKEN_TABLE,
  SEASON_TABLE,
  YIELD_TABLE,
  TRACTOR_ORDER_CONVERT_UP_V0_TABLE,
  TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE,
  TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE
} = require('../../../constants/tables');
const EnvUtil = require('../../../utils/env');
const { TractorOrderType, ApyInitType, StalkMode } = require('../models/types/types');
const { timestamps, bigintNumericColumn, largeBigintTextColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (EnvUtil.getDeploymentEnv() !== 'indexing') {
      return;
    }
    const existingTables = await queryInterface.showAllTables();

    if (!existingTables.includes(API_META_TABLE.indexing)) {
      await queryInterface.createTable(
        API_META_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          chain: {
            type: Sequelize.STRING,
            allowNull: false
          },
          lastDepositUpdate: {
            type: Sequelize.INTEGER
          },
          lastLambdaBdvs: {
            type: Sequelize.TEXT
          },
          lastTractorUpdate: {
            type: Sequelize.INTEGER
          },
          lastSiloInflowUpdate: {
            type: Sequelize.INTEGER
          },
          lastFieldInflowUpdate: {
            type: Sequelize.INTEGER
          },
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            chain: {
              fields: ['chain']
            }
          }
        }
      );
    }

    if (!existingTables.includes(TOKEN_TABLE.indexing)) {
      await queryInterface.createTable(
        TOKEN_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          address: {
            type: Sequelize.STRING,
            allowNull: false
          },
          chain: {
            type: Sequelize.STRING,
            allowNull: false
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          symbol: {
            type: Sequelize.STRING,
            allowNull: false
          },
          ...bigintNumericColumn('supply', Sequelize, { allowNull: false }),
          decimals: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          isWhitelisted: {
            type: Sequelize.BOOLEAN,
            allowNull: false
          },
          ...bigintNumericColumn('bdv', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('stalkEarnedPerSeason', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('stemTip', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('totalDeposited', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('totalDepositedBdv', Sequelize, { allowNull: false }),
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            addressChain: {
              fields: ['address', 'chain']
            }
          }
        }
      );
    }

    if (!existingTables.includes(SEASON_TABLE.indexing)) {
      await queryInterface.createTable(SEASON_TABLE.indexing, {
        season: {
          type: Sequelize.INTEGER,
          primaryKey: true
        },
        block: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        sunriseTxn: {
          type: Sequelize.STRING(66),
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(YIELD_TABLE.indexing)) {
      await queryInterface.createTable(
        YIELD_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          tokenId: {
            type: Sequelize.INTEGER,
            references: {
              model: TOKEN_TABLE.indexing,
              key: 'id'
            },
            onDelete: 'RESTRICT',
            allowNull: false
          },
          season: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          emaWindow: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          emaEffectiveWindow: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          ...bigintNumericColumn('emaBeans', Sequelize, { allowNull: false }),
          initType: {
            type: Sequelize.ENUM,
            values: Object.values(ApyInitType),
            allowNull: false
          },
          beanYield: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          stalkYield: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          ownershipYield: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            seasonEntry: {
              fields: ['tokenId', 'season', 'emaWindow', 'initType']
            }
          }
        }
      );
    }

    if (!existingTables.includes(DEPOSIT_TABLE.indexing)) {
      await queryInterface.createTable(
        DEPOSIT_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          chain: {
            type: Sequelize.STRING,
            allowNull: false
          },
          account: {
            type: Sequelize.STRING,
            allowNull: false
          },
          tokenId: {
            type: Sequelize.INTEGER,
            references: {
              model: 'token',
              key: 'id'
            },
            onDelete: 'RESTRICT',
            allowNull: false
          },
          ...bigintNumericColumn('stem', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('depositedAmount', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('depositedBdv', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('currentStalk', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('baseStalk', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('grownStalk', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('mowStem', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('mowableStalk', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('currentSeeds', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('bdvOnLambda', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('stalkOnLambda', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('seedsOnLambda', Sequelize, { allowNull: false }),
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            depositEntry: {
              fields: ['chain', 'account', 'tokenId', 'stem']
            }
          }
        }
      );
    }

    if (!existingTables.includes(TRACTOR_ORDER_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_ORDER_TABLE.indexing, {
        blueprintHash: {
          type: Sequelize.STRING(66),
          primaryKey: true
        },
        orderType: {
          type: Sequelize.ENUM,
          values: Object.values(TractorOrderType),
          allowNull: true
        },
        publisher: {
          type: Sequelize.STRING(42),
          allowNull: false
        },
        data: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        operatorPasteInstrs: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        ...largeBigintTextColumn('maxNonce', Sequelize, { allowNull: false }),
        startTime: {
          type: Sequelize.DATE,
          allowNull: false
        },
        endTime: {
          type: Sequelize.DATE,
          allowNull: false
        },
        signature: {
          type: Sequelize.STRING(132),
          allowNull: false
        },
        // Timestamp/block number of when this blueprint was published
        publishedTimestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        publishedBlock: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...bigintNumericColumn('beanTip', Sequelize, { allowNull: true }),
        cancelled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        lastExecutableSeason: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        ...timestamps(Sequelize)
      });
      await queryInterface.addIndex(TRACTOR_ORDER_TABLE.indexing, ['orderType']);
      await queryInterface.addIndex(TRACTOR_ORDER_TABLE.indexing, ['publisher']);
    }

    if (!existingTables.includes(TRACTOR_EXECUTION_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_EXECUTION_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        blueprintHash: {
          type: Sequelize.STRING(66),
          references: {
            model: TRACTOR_ORDER_TABLE.indexing,
            key: 'blueprintHash'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        ...bigintNumericColumn('nonce', Sequelize, { allowNull: false }),
        operator: {
          type: Sequelize.STRING(42),
          allowNull: false
        },
        gasCostUsd: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        tipUsd: {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        executedTimestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        executedBlock: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        executedTxn: {
          type: Sequelize.STRING(66),
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
      await queryInterface.addIndex(TRACTOR_EXECUTION_TABLE.indexing, ['operator']);
      await queryInterface.addIndex(TRACTOR_EXECUTION_TABLE.indexing, ['blueprintHash']);
    }

    if (!existingTables.includes(TRACTOR_ORDER_SOW_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_ORDER_SOW_V0_TABLE.indexing, {
        blueprintHash: {
          type: Sequelize.STRING(66),
          primaryKey: true,
          references: {
            model: TRACTOR_ORDER_TABLE.indexing,
            key: 'blueprintHash'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        ...bigintNumericColumn('pintoSownCounter', Sequelize, { allowNull: false }),
        lastExecutedSeason: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        orderComplete: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        ...bigintNumericColumn('amountFunded', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('cascadeAmountFunded', Sequelize, { allowNull: false }),
        sourceTokenIndices: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        ...bigintNumericColumn('totalAmountToSow', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minAmountToSowPerSeason', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxAmountToSowPerSeason', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minTemp', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxPodlineLength', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxGrownStalkPerBdv', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('runBlocksAfterSunrise', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('slippageRatio', Sequelize, { allowNull: false }),
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(TRACTOR_EXECUTION_SOW_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_EXECUTION_SOW_V0_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          references: {
            model: TRACTOR_EXECUTION_TABLE.indexing,
            key: 'id'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        blueprintHash: {
          type: Sequelize.STRING(66),
          references: {
            model: TRACTOR_ORDER_SOW_V0_TABLE.indexing,
            key: 'blueprintHash'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        ...bigintNumericColumn('index', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('pods', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('placeInLine', Sequelize, { allowNull: false }),
        // uint8[], in practice this list will be small so we store as comma separated string rather than ABI encoding
        usedTokenIndices: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        usedGrownStalkPerBdv: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
      await queryInterface.addIndex(TRACTOR_EXECUTION_SOW_V0_TABLE.indexing, ['blueprintHash']);
    }

    if (!existingTables.includes(TRACTOR_SNAPSHOT_SOW_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_SNAPSHOT_SOW_V0_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        snapshotTimestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        snapshotBlock: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        season: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...bigintNumericColumn('totalPintoSown', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalPodsMinted', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalCascadeFundedBelowTemp', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalCascadeFundedAnyTemp', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxSowThisSeason', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalTipsPaid', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('currentMaxTip', Sequelize, { allowNull: false }),
        totalExecutions: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        uniquePublishers: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(TRACTOR_ORDER_CONVERT_UP_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_ORDER_CONVERT_UP_V0_TABLE.indexing, {
        blueprintHash: {
          type: Sequelize.STRING(66),
          primaryKey: true,
          references: {
            model: TRACTOR_ORDER_TABLE.indexing,
            key: 'blueprintHash'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        lastExecutedTimestamp: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...bigintNumericColumn('beansLeftToConvert', Sequelize, { allowNull: false }),
        orderComplete: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        ...bigintNumericColumn('amountFunded', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('cascadeAmountFunded', Sequelize, { allowNull: false }),
        sourceTokenIndices: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        ...bigintNumericColumn('totalBeanAmountToConvert', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minBeansConvertPerExecution', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxBeansConvertPerExecution', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minTimeBetweenConverts', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minConvertBonusCapacity', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxGrownStalkPerBdv', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('grownStalkPerBdvBonusBid', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxPriceToConvertUp', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('minPriceToConvertUp', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('seedDifference', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('maxGrownStalkPerBdvPenalty', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('slippageRatio', Sequelize, { allowNull: false }),
        lowStalkDeposits: {
          type: Sequelize.ENUM,
          values: Object.values(StalkMode),
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          references: {
            model: TRACTOR_EXECUTION_TABLE.indexing,
            key: 'id'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        blueprintHash: {
          type: Sequelize.STRING(66),
          references: {
            model: TRACTOR_ORDER_CONVERT_UP_V0_TABLE.indexing,
            key: 'blueprintHash'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        usedTokenIndices: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        tokenFromAmounts: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        tokenToAmounts: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        ...bigintNumericColumn('beansConverted', Sequelize, { allowNull: false }),
        beanPriceBefore: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        beanPriceAfter: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        ...bigintNumericColumn('gsBonusStalk', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('gsBonusBdv', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('gsPenaltyStalk', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('gsPenaltyBdv', Sequelize, { allowNull: false }),
        ...timestamps(Sequelize)
      });
      await queryInterface.addIndex(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.indexing, ['blueprintHash']);
    }

    if (!existingTables.includes(TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.indexing)) {
      await queryInterface.createTable(TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        snapshotTimestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        snapshotBlock: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        season: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...bigintNumericColumn('totalBeansConverted', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalGsBonusStalk', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalGsBonusBdv', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalGsPenaltyStalk', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalGsPenaltyBdv', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalCascadeFunded', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalCascadeFundedExecutable', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('totalTipsPaid', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('currentMaxTip', Sequelize, { allowNull: false }),
        totalExecutions: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        uniquePublishers: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(SILO_INFLOW_TABLE.indexing)) {
      await queryInterface.createTable(SILO_INFLOW_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        account: {
          type: Sequelize.STRING,
          allowNull: false
        },
        token: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ...bigintNumericColumn('amount', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('bdv', Sequelize, { allowNull: false }),
        usd: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        isLp: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        isTransfer: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        isPlenty: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        block: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        txnHash: {
          type: Sequelize.STRING(66),
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(SILO_INFLOW_SNAPSHOT_TABLE.indexing)) {
      await queryInterface.createTable(
        SILO_INFLOW_SNAPSHOT_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          snapshotTimestamp: {
            type: Sequelize.DATE,
            allowNull: false
          },
          snapshotBlock: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          season: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          ...bigintNumericColumn('cumulativeBdvNet', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('cumulativeBdvIn', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('cumulativeBdvOut', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBdvNet', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBdvIn', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBdvOut', Sequelize, { allowNull: false }),
          cumulativeUsdNet: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          cumulativeUsdIn: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          cumulativeUsdOut: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdNet: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdIn: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdOut: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            season: {
              fields: ['season']
            }
          }
        }
      );
    }

    if (!existingTables.includes(FIELD_INFLOW_TABLE.indexing)) {
      await queryInterface.createTable(FIELD_INFLOW_TABLE.indexing, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        account: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ...bigintNumericColumn('beans', Sequelize, { allowNull: false }),
        usd: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        isMarket: {
          type: Sequelize.BOOLEAN,
          allowNull: false
        },
        block: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        txnHash: {
          type: Sequelize.STRING(66),
          allowNull: false
        },
        ...timestamps(Sequelize)
      });
    }

    if (!existingTables.includes(FIELD_INFLOW_SNAPSHOT_TABLE.indexing)) {
      await queryInterface.createTable(
        FIELD_INFLOW_SNAPSHOT_TABLE.indexing,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          snapshotTimestamp: {
            type: Sequelize.DATE,
            allowNull: false
          },
          snapshotBlock: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          season: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          ...bigintNumericColumn('cumulativeBeansNet', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('cumulativeBeansIn', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('cumulativeBeansOut', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBeansNet', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBeansIn', Sequelize, { allowNull: false }),
          ...bigintNumericColumn('deltaBeansOut', Sequelize, { allowNull: false }),
          cumulativeUsdNet: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          cumulativeUsdIn: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          cumulativeUsdOut: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdNet: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdIn: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          deltaUsdOut: {
            type: Sequelize.FLOAT,
            allowNull: false
          },
          ...timestamps(Sequelize)
        },
        {
          uniqueKeys: {
            season: {
              fields: ['season']
            }
          }
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(API_META_TABLE.indexing);
    await queryInterface.dropTable(DEPOSIT_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_ORDER_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_EXECUTION_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_ORDER_SOW_V0_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_EXECUTION_SOW_V0_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_SNAPSHOT_SOW_V0_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_ORDER_CONVERT_UP_V0_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_EXECUTION_CONVERT_UP_V0_TABLE.indexing);
    await queryInterface.dropTable(TRACTOR_SNAPSHOT_CONVERT_UP_V0_TABLE.indexing);
    await queryInterface.dropTable(SILO_INFLOW_TABLE.indexing);
    await queryInterface.dropTable(SILO_INFLOW_SNAPSHOT_TABLE.indexing);
    await queryInterface.dropTable(FIELD_INFLOW_TABLE.indexing);
    await queryInterface.dropTable(FIELD_INFLOW_SNAPSHOT_TABLE.indexing);
  }
};
