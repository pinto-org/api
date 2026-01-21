const BlueprintConstants = require('../../../../../service/tractor/blueprints/blueprint-constants');
const SowExecutionDto = require('../../../../dto/tractor/SowExecutionDto');

class SowExecutionAssembler {
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
      usedGrownStalkPerBdv: executionDto.usedGrownStalkPerBdv,
      referrer: executionDto.referrer,
      referrerPods: executionDto.referrerPods,
      referrerPlaceInLine: executionDto.referrerPlaceInLine,
      refereePods: executionDto.refereePods,
      refereePlaceInLine: executionDto.refereePlaceInLine
    };
  }

  static fromModel(executionModel) {
    return SowExecutionDto.fromModel(executionModel);
  }
}
module.exports = SowExecutionAssembler;
