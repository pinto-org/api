const { sequelize } = require('../../repository/postgres/models');
const FieldInflowAssembler = require('../../repository/postgres/models/assemblers/inflow/field-inflow-assembler');
const SharedRepository = require('../../repository/postgres/queries/shared-repository');

class FieldInflowService {
  static async insertInflows(dtos) {
    const models = dtos.map((d) => FieldInflowAssembler.toModel(d));
    await SharedRepository.genericUpsert(sequelize.models.FieldInflow, models, false);
  }
}
module.exports = FieldInflowService;
