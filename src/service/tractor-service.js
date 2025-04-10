const TractorOrderAssembler = require('../repository/postgres/models/assemblers/tractor-order-assembler');
const TractorOrderRepository = require('../repository/postgres/queries/tractor-order-repository');

class TractorService {
  // Updates the given deposits via upsert
  static async updateOrders(orderDtos) {
    const models = orderDtos.map((d) => TractorOrderAssembler.toModel(d));
    const updatedOrders = await TractorOrderRepository.upsertOrders(models);
    return updatedOrders;
  }
}
module.exports = TractorService;
