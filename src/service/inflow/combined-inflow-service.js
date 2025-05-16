const InflowRepository = require('../../repository/postgres/queries/inflow-repository');
const CombinedInflowDto = require('../../repository/dto/inflow/CombinedInflowDto');

class CombinedInflowService {
  static async getCombinedInflowData() {
    const rows = await InflowRepository.getCombinedInflowData();
    return rows.map((row) => CombinedInflowDto.fromRow(row));
  }
}

module.exports = CombinedInflowService;
