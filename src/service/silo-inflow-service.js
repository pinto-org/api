const { sequelize } = require('../repository/postgres/models');
const SiloInflowAssembler = require('../repository/postgres/models/assemblers/silo-inflow-assembler');
const SharedRepository = require('../repository/postgres/queries/shared-repository');

class SiloInflowService {
  static async insertInflows(dtos) {
    const models = dtos.map((d) => SiloInflowAssembler.toModel(d));
    await SharedRepository.genericUpsert(sequelize.models.SiloInflow, models, false);
  }
}
module.exports = SiloInflowService;
