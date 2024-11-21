const { RuntimeConstants } = require('../../src/constants/runtime-constants');
const BeanstalkEth = require('../../src/constants/raw/beanstalk-eth');
const BeanstalkArb = require('../../src/constants/raw/beanstalk-arb');
const PintoBase = require('../../src/constants/raw/pinto-base');
const EnvUtil = require('../../src/utils/env');

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

module.exports = {
  mockBeanstalkConstants,
  mockPintoConstants
};
