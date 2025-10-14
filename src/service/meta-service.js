const { C } = require('../constants/runtime-constants');
const MetaRepository = require('../repository/postgres/queries/meta-repository');
const { formatBigintHex } = require('../utils/bigint');
const { allToBigInt } = require('../utils/number');

class AppMetaService {
  static async init() {
    const meta = await MetaRepository.get(C().CHAIN);
    if (!meta) {
      await MetaRepository.insert({ chain: C().CHAIN });
    }
  }

  static async getLambdaMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta?.lastDepositUpdate ? meta.lastDepositUpdate : null,
      lastBdvs: meta?.lastLambdaBdvs ? allToBigInt(JSON.parse(meta.lastLambdaBdvs)) : null
    };
  }

  static async setLastDepositUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastDepositUpdate: lastUpdate });
  }

  static async setLastLambdaBdvs(lastBdvs) {
    await MetaRepository.update(C().CHAIN, { lastLambdaBdvs: JSON.stringify(lastBdvs, formatBigintHex) });
  }

  static async getTractorMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta?.lastTractorUpdate ? meta.lastTractorUpdate : null
    };
  }

  static async setLastTractorUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastTractorUpdate: lastUpdate });
  }

  /**
   * @deprecated Use the combined Inflow task instead
   */
  static async getSiloInflowMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta?.lastSiloInflowUpdate ? meta.lastSiloInflowUpdate : null
    };
  }

  /**
   * @deprecated Use the combined Inflow task instead
   */
  static async setLastSiloInflowUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastSiloInflowUpdate: lastUpdate });
  }

  /**
   * @deprecated Use the combined Inflow task instead
   */
  static async getFieldInflowMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta?.lastFieldInflowUpdate ? meta.lastFieldInflowUpdate : null
    };
  }

  /**
   * @deprecated Use the combined Inflow task instead
   */
  static async setLastFieldInflowUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastFieldInflowUpdate: lastUpdate });
  }

  static async getInflowMeta() {
    const meta = await MetaRepository.get(C().CHAIN);
    return {
      lastUpdate: meta?.lastInflowUpdate ? meta.lastInflowUpdate : null
    };
  }

  static async setLastInflowUpdate(lastUpdate) {
    await MetaRepository.update(C().CHAIN, { lastInflowUpdate: lastUpdate });
  }
}

module.exports = AppMetaService;
