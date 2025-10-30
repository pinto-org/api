const InflowRepository = require('../../repository/postgres/queries/inflow-repository');
const CombinedInflowSnapshotDto = require('../../repository/dto/inflow/CombinedInflowSnapshotDto');
const AsyncContext = require('../../utils/async/context');
const AppMetaService = require('../meta-service');
const { Sequelize } = require('../../repository/postgres/models');

class CombinedInflowService {
  static async getCombinedInflowData(request) {
    const criteriaList = [];
    if (request.betweenSeasons) {
      criteriaList.push({
        season: {
          [Sequelize.Op.between]: request.betweenSeasons
        }
      });
    }
    request.limit ??= 100;

    const { snapshots, total, lastUpdated } = await AsyncContext.sequelizeTransaction(async () => {
      const [{ snapshots, total }, inflowMeta] = await Promise.all([
        InflowRepository.getCombinedInflowSnapshots({
          criteriaList,
          ...request
        }),
        AppMetaService.getInflowMeta()
      ]);
      return {
        snapshots,
        total,
        lastUpdated: inflowMeta.lastUpdate
      };
    });
    const dtos = snapshots.map((row) => CombinedInflowSnapshotDto.fromRow(row));

    return {
      lastUpdated,
      snapshots: dtos,
      totalRecords: total
    };
  }
}

module.exports = CombinedInflowService;
