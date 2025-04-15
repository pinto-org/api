const TractorSowV0Service = require('../service/tractor-blueprints/sow-v0');

class TractorConstants {
  static knownBlueprints() {
    return {
      [TractorSowV0Service.orderType]: TractorSowV0Service
    };
  }
}

module.exports = TractorConstants;
