const BlueprintConstants = require('../../../../../service/tractor-blueprints/blueprint-constants');
const SowV0ExecutionDto = require('../../../../dto/tractor/SowV0ExecutionDto');

class SowV0ExecutionAssembler {
  static toModel(executionDto) {
    return {
      id: executionDto.id,
      blueprintHash: executionDto.blueprintHash,
      index: executionDto.index,
      beans: executionDto.beans,
      pods: executionDto.pods,
      placeInLine: executionDto.placeInLine,
      usedTokenIndices: executionDto.usedTokens
        .map((token) => BlueprintConstants.tokenIndexMap()[token.toLowerCase()])
        .join(','),
      usedGrownStalkPerBdv: executionDto.usedGrownStalkPerBdv
    };
  }

  static fromModel(executionModel) {
    return SowV0ExecutionDto.fromModel(executionModel);
  }
}

module.exports = SowV0ExecutionAssembler;
