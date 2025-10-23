const TractorConvertUpV0Service = require('../service/tractor/blueprints/convert-up-v0');
const TractorSowV0Service = require('../service/tractor/blueprints/sow-v0');

class TractorConstants {
  static knownBlueprints() {
    return {
      [TractorSowV0Service.orderType]: TractorSowV0Service,
      [TractorConvertUpV0Service.orderType]: TractorConvertUpV0Service
    };
  }
}

module.exports = TractorConstants;
