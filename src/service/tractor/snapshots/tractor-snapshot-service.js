const { Sequelize } = require('../../../repository/postgres/models');
const AsyncContext = require('../../../utils/async/context');
const AppMetaService = require('../../meta-service');

class TractorSnapshotService {
  static snapshotRepository;
  static snapshotAssembler;
  // This should be set according to the block of the first order of each type.
  // It should be the block of the top of the following hour, and in practice correspond to a sunrise.
  static initialSnapshotBlock;

  /**
   * Returns the block number of when the next snapshot should be taken
   */
  static nextSnapshotBlock(tractorLastUpdate, nextSunriseBlock) {
    if (tractorLastUpdate < this.initialSnapshotBlock) {
      // This snapshot has not been initialized yet, ignore the sunrise block
      return this.initialSnapshotBlock;
    } else {
      // If no sunrise was detected, caller can advance as much as desired
      return nextSunriseBlock ?? Number.MAX_SAFE_INTEGER;
    }
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
