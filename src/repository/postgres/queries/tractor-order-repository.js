const Concurrent = require('../../../utils/async/concurrent');
const AsyncContext = require('../../../utils/async/context');
const { sequelize } = require('../models');

class TractorOrderRepository {
  // Inserts/Updates the given order rows
  static async upsertOrders(orders) {
    const upserted = [];

    const TAG = Concurrent.tag('upsertTractorOrders');
    for (const row of orders) {
      await Concurrent.run(TAG, 50, async () => {
        const [order, _isCreated] = await sequelize.models.TractorOrder.upsert(row, {
          validate: true,
          transaction: AsyncContext.getOrUndef('transaction'),
          returning: true
        });
        upserted.push(order);
      });
    }
    await Concurrent.allResolved(TAG);

    return upserted;
  }
}
module.exports = TractorOrderRepository;
