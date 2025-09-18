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
      gsBonusAmount: executionDto.gsBonusAmount,
      gsBonusBdv: executionDto.gsBonusBdv,
      gsPenaltyAmount: executionDto.gsPenaltyAmount,
      gsPenaltyBdv: executionDto.gsPenaltyBdv
    };
  }

  static fromModel(executionModel) {
    return ConvertUpV0ExecutionDto.fromModel(executionModel);
  }
}
module.exports = ConvertUpV0ExecutionAssembler;
