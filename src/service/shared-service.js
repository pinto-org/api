const SharedRepository = require('../repository/postgres/queries/shared-repository');

class SharedService {
  // Given a model and an assembler, retrieves all entities matching the criteria
  static async genericEntityRetrieval(model, assembler, criteria) {
    const models = await SharedRepository.genericFind(model, criteria);
    return models.map((d) => assembler.fromModel(d));
  }

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
