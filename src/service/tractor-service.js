const { sequelize } = require('../repository/postgres/models');
const TractorOrderAssembler = require('../repository/postgres/models/assemblers/tractor-order-assembler');
const SowOrderV0Assembler = require('../repository/postgres/models/assemblers/tractor-order-sow-v0-assembler');
const SharedRepository = require('../repository/postgres/queries/shared-repository');
const TractorOrderRepository = require('../repository/postgres/queries/tractor-order-repository');

class TractorService {
  // Via upsert
  static async updateOrders(orderDtos) {
    const models = orderDtos.map((d) => TractorOrderAssembler.toModel(d));
    const updatedOrders = await SharedRepository.genericUpsert(sequelize.models.TractorOrder, models, true);
    const updatedOrderDtos = updatedOrders.map((d) => TractorOrderAssembler.fromModel(d));
    return updatedOrderDtos;
  }

  // Via upsert
  static async updateSowV0Orders(orderDtos) {
    const models = orderDtos.map((d) => SowOrderV0Assembler.toModel(d));
    const updatedOrders = await SharedRepository.genericUpsert(sequelize.models.TractorSowV0, models, true);
    const updatedOrderDtos = updatedOrders.map((d) => SowOrderV0Assembler.fromModel(d));
    return updatedOrderDtos;
  }
}
module.exports = TractorService;
