const Concurrent = require('../../../utils/async/concurrent');
const AsyncContext = require('../../../utils/async/context');

class SharedRepository {
  // Retrieves all entities matching the criteria
  static async genericFind(model, criteria) {
    return await model.findAll({
      where: criteria,
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }
  // Upserts entities for any model. Uses the active transaction
  static async genericUpsert(model, values, returning) {
    const upserted = [];

    const TAG = Concurrent.tag(`genericUpsert-${model.name}`);
    for (const v of values) {
      await Concurrent.run(TAG, 50, async () => {
        const [row, _isCreated] = await model.upsert(v, {
          validate: true,
          transaction: AsyncContext.getOrUndef('transaction'),
          returning
        });
        if (returning) {
          upserted.push(row);
        }
      });
    }
    await Concurrent.allResolved(TAG);

    if (returning) {
      return upserted;
    }
  }
}
module.exports = SharedRepository;
