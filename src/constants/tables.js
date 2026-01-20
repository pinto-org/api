const EnvUtil = require('../utils/env');

// Allows accessing the indexing environment table. Queries within the application
// should use the env table, prod/indexing should only be explicitly used for migrations.
const envNamed = (name) => {
  return {
    env: EnvUtil.getDeploymentEnv() === 'indexing' ? `indexing_${name}` : name,
    prod: name,
    indexing: `indexing_${name}`
  };
};

const API_META_TABLE = envNamed('ApiMeta');
const DEPOSIT_TABLE = envNamed('deposit');
const FIELD_INFLOW_TABLE = envNamed('field_inflow');
const FIELD_INFLOW_SNAPSHOT_TABLE = envNamed('field_inflow_snapshot');
const SEASON_TABLE = envNamed('season');
const SILO_INFLOW_TABLE = envNamed('silo_inflow');
const SILO_INFLOW_SNAPSHOT_TABLE = envNamed('silo_inflow_snapshot');
const TOKEN_TABLE = envNamed('token');
const TRACTOR_EXECUTION_TABLE = envNamed('tractor_execution');
const TRACTOR_EXECUTION_SOW_TABLE = envNamed('tractor_execution_sow');
const TRACTOR_EXECUTION_CONVERT_UP_TABLE = envNamed('tractor_execution_convert_up');
const TRACTOR_ORDER_TABLE = envNamed('tractor_order');
const TRACTOR_ORDER_SOW_TABLE = envNamed('tractor_order_sow');
const TRACTOR_ORDER_CONVERT_UP_TABLE = envNamed('tractor_order_convert_up');
const TRACTOR_SNAPSHOT_SOW_TABLE = envNamed('tractor_snapshot_sow');
const TRACTOR_SNAPSHOT_CONVERT_UP_TABLE = envNamed('tractor_snapshot_convert_up');
const YIELD_TABLE = envNamed('yield');

module.exports = {
  API_META_TABLE,
  DEPOSIT_TABLE,
  FIELD_INFLOW_TABLE,
  FIELD_INFLOW_SNAPSHOT_TABLE,
  SEASON_TABLE,
  SILO_INFLOW_TABLE,
  SILO_INFLOW_SNAPSHOT_TABLE,
  TOKEN_TABLE,
  TRACTOR_EXECUTION_TABLE,
  TRACTOR_EXECUTION_SOW_TABLE,
  TRACTOR_EXECUTION_CONVERT_UP_TABLE,
  TRACTOR_ORDER_TABLE,
  TRACTOR_ORDER_SOW_TABLE,
  TRACTOR_ORDER_CONVERT_UP_TABLE,
  TRACTOR_SNAPSHOT_SOW_TABLE,
  TRACTOR_SNAPSHOT_CONVERT_UP_TABLE,
  YIELD_TABLE
};
