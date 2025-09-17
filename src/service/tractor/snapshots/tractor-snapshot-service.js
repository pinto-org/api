const { C } = require('../../../constants/runtime-constants');
const { Sequelize } = require('../../../repository/postgres/models');
const AsyncContext = require('../../../utils/async/context');
const ChainUtil = require('../../../utils/chain');
const AppMetaService = require('../../meta-service');

class TractorSnapshotService {
  static snapshotRepository;
  static snapshotAssembler;
  // This should be set according to the block of the first order of each type.
  // It should be the block of the top of the following hour.
  static initialSnapshotBlock;

  /**
   * Returns the block number of when the next snapshot should be taken
   */
  static async nextSnapshotBlock() {
    const latestSnapshot = await this.snapshotRepository.latestSnapshot();
    if (latestSnapshot) {
      const dto = this.snapshotAssembler.fromModel(latestSnapshot);
      return dto.snapshotBlock + ChainUtil.blocksPerInterval(C().CHAIN, 1000 * 60 * 60);
    }
    return this.initialSnapshotBlock;
  }

  /**
   * Inserts a snapshot of the current state.
   * Data must have already been updated through snapshotBlock (having written to meta is optional).
   * @param {number} snapshotBlock
   * @abstract
   */
  static async takeSnapshot(_snapshotBlock) {
    throw new Error('takeSnapshot must be implemented by subclass');
  }

  /**
   * Retrieves tractor snapshots matching the requested criteria
   * @param {import('../../../../types/types').TractorSnapshotsRequest} request
   * @returns {Promise<import('../../../../types/types').TractorSnapshotsResult>}
   */
  static async getSnapshots(request) {
    const criteriaList = [];
    if (request.betweenTimes) {
      criteriaList.push({
        snapshotTimestamp: {
          [Sequelize.Op.between]: request.betweenTimes
        }
      });
    }
    if (request.betweenSeasons) {
      criteriaList.push({
        season: {
          [Sequelize.Op.between]: request.betweenSeasons
        }
      });
    }
    request.limit ??= 100;

    const { snapshots, total, lastUpdated } = await AsyncContext.sequelizeTransaction(async () => {
      const [{ snapshots, total }, tractorMeta] = await Promise.all([
        this.snapshotRepository.findAllWithOptions({
          criteriaList,
          ...request
        }),
        AppMetaService.getTractorMeta()
      ]);
      return { snapshots, total, lastUpdated: tractorMeta.lastUpdate };
    });
    let dtos = snapshots.map((d) => {
      const dto = this.snapshotAssembler.fromModel(d);
      delete dto.id;
      return dto;
    });

    return {
      lastUpdated,
      snapshots: dtos,
      totalRecords: total
    };
  }
}

module.exports = TractorSnapshotService;
