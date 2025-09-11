const ConvertUpV0ExecutionDto = require('../../../../dto/tractor/ConvertUpV0ExecutionDto');

class ConvertUpV0ExecutionAssembler {
  static toModel(executionDto) {
    return {
      id: executionDto.id,
      blueprintHash: executionDto.blueprintHash
      // TBD
    };
  }

  static fromModel(executionModel) {
    return ConvertUpV0ExecutionDto.fromModel(executionModel);
  }
}
module.exports = ConvertUpV0ExecutionAssembler;
