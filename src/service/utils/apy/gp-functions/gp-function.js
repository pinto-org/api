const { C } = require('../../../../constants/runtime-constants');
const DefaultGaugePointFunction = require('./default');
const LegacyDefaultGaugePointFunction = require('./legacy');

class GPFunction {
  static forSeason(season, currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv) {
    if (C().PROJECT === 'beanstalk' && season < C('arb').MILESTONE.startSeason) {
      // Beanstalk used a different function prior to L2 migration
      return LegacyDefaultGaugePointFunction.next(
        currentGaugePoints,
        optimalPercentDepositedBdv,
        percentOfDepositedBdv
      );
    } else {
      return DefaultGaugePointFunction.next(currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv);
    }
  }
}

module.exports = GPFunction;
