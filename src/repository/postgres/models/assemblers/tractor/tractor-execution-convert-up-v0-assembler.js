const BlueprintConstants = require('../../../../../service/tractor/blueprints/blueprint-constants');
const ConvertUpV0ExecutionDto = require('../../../../dto/tractor/ConvertUpV0ExecutionDto');

class ConvertUpV0ExecutionAssembler {
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
    return ConvertUpV0ExecutionDto.fromModel(executionModel);
  }
}
module.exports = ConvertUpV0ExecutionAssembler;
