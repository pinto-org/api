const { C } = require('../../../constants/runtime-constants');

const BLUEPRINT_VERSIONS_MAP = {
  SOW: {
    [C().SOW_V0]: 'V0',
    [C().SOW_REFERRAL]: 'REFERRAL'
  },
  CONVERT_UP: {
    [C().CONVERT_UP_V0]: 'V0'
  }
};

class BlueprintConstants {
  static blueprintVersion(orderType, blueprintAddress) {
    return BLUEPRINT_VERSIONS_MAP[orderType][blueprintAddress];
  }

  static tokenIndexMap() {
    return {
      [C().BEAN]: 0,
      [C().PINTOWETH]: 1,
      [C().PINTOCBETH]: 2,
      [C().PINTOCBBTC]: 3,
      [C().PINTOUSDC]: 4,
      [C().PINTOWSOL]: 5,
      [C().PINTOWSTETH]: 6
    };
  }

  static tokenIndexReverseMap() {
    return Object.fromEntries(Object.entries(this.tokenIndexMap()).map(([key, value]) => [value, key]));
  }
}

module.exports = BlueprintConstants;
