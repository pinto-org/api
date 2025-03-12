// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //

const EnvUtil = require('../../utils/env');
const SubgraphClients = require('../../datasources/subgraph-client');

const pintoLaunchAbi = require('../../datasources/abi/beanstalk/Pinto-Launch.json');
const erc20Abi = require('../../datasources/abi/ERC20.json');
const wrappedDepositAbi = require('../../datasources/abi/WrappedDepositERC20.json');
const wellAbi = require('../../datasources/abi/basin/Well.json');
const wellFunctionAbi = require('../../datasources/abi/basin/WellFunction.json');

const contracts = {
  BEANSTALK: ['0xD1A0D188E861ed9d15773a2F3574a2e94134bA8f', null, pintoLaunchAbi],
  BEAN: ['0xb170000aeeFa790fa61D6e837d1035906839a3c8', 6, erc20Abi],
  PINTOWETH: ['0x3e11001CfbB6dE5737327c59E10afAB47B82B5d3', 18, wellAbi],
  PINTOCBETH: ['0x3e111115A82dF6190e36ADf0d552880663A4dBF1', 18, wellAbi],
  PINTOCBBTC: ['0x3e11226fe3d85142B734ABCe6e58918d5828d1b4', 18, wellAbi],
  PINTOWSOL: ['0x3e11444c7650234c748D743D8d374fcE2eE5E6C9', 18, wellAbi],
  PINTOUSDC: ['0x3e1133aC082716DDC3114bbEFEeD8B1731eA9cb1', 18, wellAbi],
  SPINTO: ['0x00b174d66ada7d63789087f50a9b9e0e48446dc1', 18, wrappedDepositAbi],
  WETH: ['0x4200000000000000000000000000000000000006', 18, erc20Abi],
  CBETH: ['0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', 18, erc20Abi],
  CBBTC: ['0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 8, erc20Abi],
  WSOL: ['0x1C61629598e4a901136a81BC138E5828dc150d67', 9, erc20Abi],
  USDC: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8, erc20Abi],
  CP2: ['0xBA510C289fD067EBbA41335afa11F0591940d6fe', null, wellFunctionAbi],
  STABLE2: ['0xBA51055a97b40d7f41f3F64b57469b5D45B67c87', null, wellFunctionAbi]
};

// Extract values from the above contracts
const ADDRESSES = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [k, v[0].toLowerCase()]));
const decimals = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[1]]));
const ABIS = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[2]]));

const DECIMALS = {
  ...decimals,
  bdv: 6,
  seeds: 6,
  stalk: 16,
  gaugePoints: 18,
  beanToMaxLpGpPerBdvRatio: 20,
  optimalPercentDepositedBdv: 6
};

const MILESTONE = {
  startSeason: 1,
  endSeason: 99999999,
  isGaugeEnabled: ({ season, block }) => true
};

const SG = EnvUtil.getSG('base');
SG.BEANSTALK = SubgraphClients.named(SG.BEANSTALK);
SG.BEAN = SubgraphClients.named(SG.BEAN);
SG.BASIN = SubgraphClients.named(SG.BASIN);

const MISC = {
  MIN_EMA_SEASON: 2
};

Object.freeze(ADDRESSES);
Object.freeze(DECIMALS);
Object.freeze(ABIS);
Object.freeze(MILESTONE);
Object.freeze(SG);
Object.freeze(MISC);

// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //
module.exports = {
  CHAIN: 'base',
  PROJECT: 'pinto',
  ADDRESSES,
  DECIMALS,
  ABIS,
  MILESTONE,
  SG,
  MISC
};
