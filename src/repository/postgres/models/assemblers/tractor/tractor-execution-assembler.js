const TractorExecutionDto = require('../../../../dto/tractor/TractorExecutionDto');

class TractorExecutionAssembler {
  static toModel(executionDto) {
    return {
      id: executionDto.id,
      blueprintHash: executionDto.blueprintHash,
      nonce: executionDto.nonce,
      operator: executionDto.operator,
      gasCostUsd: executionDto.gasCostUsd,
      tipUsd: executionDto.tipUsd,
      executedTimestamp: executionDto.executedTimestamp,
      executedBlock: executionDto.executedBlock,
      executedTxn: executionDto.executedTxn
    };
  }

  static fromModel(executionModel) {
    return TractorExecutionDto.fromModel(executionModel);
  }
}
module.exports = TractorExecutionAssembler;
