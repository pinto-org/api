// Disable env. Mock entire module so the validations do not execute
jest.mock('../../src/utils/env', () => {
  return {
    isChainEnabled: jest.fn(),
    defaultChain: jest.fn().mockReturnValue('base'),
    getAlchemyKey: jest.fn(),
    getEnabledChains: jest.fn(),
    getEnabledCronJobs: jest.fn(),
    getIndexingStopBlock: jest.fn().mockReturnValue(Number.MAX_SAFE_INTEGER),
    getDeploymentEnv: jest.fn(),
    getDiscordWebhooks: jest.fn(),
    getDiscordPrefix: jest.fn(),
    getSG: jest.fn().mockImplementation(() => ({
      BEANSTALK: 'a',
      BEAN: 'b',
      BASIN: 'c'
    })),
    getDevTractor: jest.fn().mockReturnValue({}),
    isLocalRpc: jest.fn().mockReturnValue(false)
  };
});
// Disable alchemy config. Mock entire module so the static block does not execute
jest.mock('../../src/datasources/alchemy', () => {
  return {
    providerForChain: jest.fn()
  };
});
// Disables all database interactions
jest.mock('../../src/repository/postgres/models/index', () => {
  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn()
      }),
      models: {
        Meta: {},
        Token: {},
        Deposit: {},
        Yield: {},
        TractorOrder: {},
        TractorExecution: {},
        TractorOrderSowV0: {},
        TractorExecutionSowV0: {}
      }
    },
    Sequelize: {
      Op: {
        or: 'a',
        and: 'b'
      },
      literal: jest.fn()
    }
  };
});
// Disables any discord messaging
jest.mock('../../src/utils/discord', () => ({}));
// Disables logs
console.log = () => {};
