const BlueprintConstants = require('../../../../../service/tractor/blueprints/blueprint-constants');
const ConvertUpExecutionDto = require('../../../../dto/tractor/ConvertUpExecutionDto');

class ConvertUpExecutionAssembler {
  static toModel(executionDto) {
    return {
      id: executionDto.id,
      blueprintHash: executionDto.blueprintHash,
      usedTokenIndices: executionDto.usedTokens
        .map((token) => BlueprintConstants.tokenIndexMap()[token.toLowerCase()])
        .join(','),
      tokenFromAmounts: executionDto.tokenFromAmounts.join(','),
      tokenToAmounts: executionDto.tokenToAmounts.join(','),
      beansConverted: executionDto.beansConverted,
      beanPriceBefore: executionDto.beanPriceBefore,
      beanPriceAfter: executionDto.beanPriceAfter,
      gsBonusStalk: executionDto.gsBonusStalk,
      gsBonusBdv: executionDto.gsBonusBdv,
      gsPenaltyStalk: executionDto.gsPenaltyStalk,
      gsPenaltyBdv: executionDto.gsPenaltyBdv
    };
  }

  static fromModel(executionModel) {
    return ConvertUpExecutionDto.fromModel(executionModel);
  }
}
module.exports = ConvertUpExecutionAssembler;
