const { RuntimeConstants, C } = require('../../src/constants/runtime-constants');
const BeanstalkEth = require('../../src/constants/raw/beanstalk-eth');
const BeanstalkArb = require('../../src/constants/raw/beanstalk-arb');
const PintoBase = require('../../src/constants/raw/pinto-base');
const EnvUtil = require('../../src/utils/env');
const ERC20Info = require('../../src/datasources/erc20-info');

function mockBeanstalkConstants() {
  jest.spyOn(EnvUtil, 'defaultChain').mockReturnValue('eth');
  jest.spyOn(RuntimeConstants, '_getMapping').mockReturnValue({
    eth: BeanstalkEth,
    arb: BeanstalkArb
  });
}

function mockPintoConstants() {
  jest.spyOn(RuntimeConstants, '_getMapping').mockReturnValue({
    base: PintoBase
  });
}

function mockPintoERC20s() {
  const erc20s = [
    { token: C().BEAN, name: 'Pinto', symbol: 'PINTO', decimals: 6 },
    {
      token: C().PINTOWETH,
      name: 'PINTO:WETH Constant Product 2 Upgradeable Well',
      symbol: 'U-PINTOWETHCP2w',
      decimals: 18
    },
    {
      token: C().PINTOCBETH,
      name: 'PINTO:CBETH Constant Product 2 Upgradeable Well',
      symbol: 'U-PINTOCBETHCP2w',
      decimals: 18
    },
    {
      token: C().PINTOCBBTC,
      name: 'PINTO:CBBTC Constant Product 2 Upgradeable Well',
      symbol: 'U-PINTOCBBTCCP2w',
      decimals: 18
    },
    {
      token: C().PINTOWSOL,
      name: 'PINTO:WSOL Constant Product 2 Upgradeable Well',
      symbol: 'U-PINTOWSOLCP2w',
      decimals: 18
    },
    {
      token: C().PINTOWSTETH,
      name: 'PINTO:WSTETH Constant Product 2 Upgradeable Well',
      symbol: 'U-PINTOWSTETHC2w',
      decimals: 18
    },
    { token: C().PINTOUSDC, name: 'PINTO:USDC Stable 2 Upgradeable Well', symbol: 'U-PINTOUSDCS2w', decimals: 18 },
    { token: C().WETH, name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 },
    { token: C().CBETH, name: 'Coinbase Wrapped Staked ETH', symbol: 'cbETH', decimals: 18 },
    { token: C().CBBTC, name: 'Coinbase Wrapped BTC', symbol: 'cbBTC', decimals: 8 },
    { token: C().WSOL, name: 'Wrapped SOL', symbol: 'SOL', decimals: 9 },
    { token: C().USDC, name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    { token: C().WSTETH, name: 'Wrapped Staked ETH', symbol: 'WSTETH', decimals: 18 }
  ];

  jest.spyOn(ERC20Info, 'getTokenInfo').mockImplementation((token) => {
    const mocked = erc20s.find((t) => t.token.toLowerCase() === token.toLowerCase());
    return mocked ?? { address: token, name: 'a', symbol: 'b', decimals: 6 };
  });
}

module.exports = {
  mockBeanstalkConstants,
  mockPintoConstants,
  mockPintoERC20s
};
