class SharedService {
  // Given dtos and an assembler, updates the underlying entities via upsert.
  static async genericEntityUpdate(dtos, model, assembler, returning) {
    const models = dtos.map((d) => assembler.toModel(d));
    const updatedModels = await SharedRepository.genericUpsert(model, models, returning);
    if (returning) {
      const updatedDtos = updatedModels.map((d) => assembler.fromModel(d));
      return updatedDtos;
    }
  }
}
module.exports = SharedService;
