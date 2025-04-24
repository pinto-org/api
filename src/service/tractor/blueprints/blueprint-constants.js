const { C } = require('../../../constants/runtime-constants');

class BlueprintConstants {
  static tokenIndexMap() {
    return {
      [C().BEAN]: 0,
      [C().PINTOWETH]: 1,
      [C().PINTOCBETH]: 2,
      [C().PINTOCBBTC]: 3,
      [C().PINTOUSDC]: 4,
      [C().PINTOWSOL]: 5
    };
  }

  static tokenIndexReverseMap() {
    return Object.fromEntries(Object.entries(this.tokenIndexMap()).map(([key, value]) => [value, key]));
  }
}

module.exports = BlueprintConstants;
