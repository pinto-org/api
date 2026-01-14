const TractorConvertUpService = require('../service/tractor/blueprints/convert-up');
const TractorSowService = require('../service/tractor/blueprints/sow');

class TractorConstants {
  static knownBlueprints() {
    return {
      [TractorSowService.orderType]: TractorSowService,
      [TractorConvertUpService.orderType]: TractorConvertUpService
    };
  }
}

module.exports = TractorConstants;
