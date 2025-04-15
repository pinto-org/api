const TractorSowV0Service = require('../service/tractor-blueprints/sow-v0');

class TractorConstants {
  static knownBlueprints() {
    return {
      [TractorSowV0Service.orderType]: TractorSowV0Service
    };
  }

  static getSowingTokenIndexMap() {
    return {
      [C().BEAN]: 0,
      [C().PINTOWETH]: 1,
      [C().PINTOCBETH]: 2,
      [C().PINTOCBBTC]: 3,
      [C().PINTOUSDC]: 4,
      [C().PINTOWSOL]: 5
    };
  }
}

module.exports = TractorConstants;
