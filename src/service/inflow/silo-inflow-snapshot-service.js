const { SILO_INFLOW_SNAPSHOT_TABLE, SILO_INFLOW_TABLE } = require('../../constants/tables');
const SiloInflowSnapshotDto = require('../../repository/dto/inflow/SiloInflowSnapshotDto');
const SeasonDto = require('../../repository/dto/SeasonDto');
const { sequelize } = require('../../repository/postgres/models');
const SiloInflowSnapshotAssembler = require('../../repository/postgres/models/assemblers/inflow/silo-inflow-snapshot-assembler');
const SeasonRepository = require('../../repository/postgres/queries/season-repository');
const SharedRepository = require('../../repository/postgres/queries/shared-repository');
const AsyncContext = require('../../utils/async/context');

class SiloInflowSnapshotService {
  static async takeMissingSnapshots(lastInflowUpdate) {
    // Find max processed season for this block number
    const latestSeason = await SeasonRepository.findMaxSeasonForBlock(lastInflowUpdate);
    if (!latestSeason) {
      return;
    }
    const latestSeasonDto = SeasonDto.fromModel(latestSeason);

    // Find missing seasons within the season number corresponding to that range
    const missingSeasons = await this.findMissingSeasons(latestSeasonDto.season);
    if (missingSeasons.length === 0) {
      return;
    }
    // Always need to include the previous season so deltas can be computed
    const prevSeason = missingSeasons[0] - 1;
    missingSeasons.push(prevSeason);
    const seasonsIn = missingSeasons.join(',');

    const [results] = await sequelize.query(
      `with cumulative as (
        select
          s.season,
          s.timestamp,
          s.block,
          sub.bdv_net as cumulative_bdv_net,
          sub.bdv_in as cumulative_bdv_in,
          sub.bdv_out as cumulative_bdv_out,
          sub.usd_net as cumulative_usd_net,
          sub.usd_in as cumulative_usd_in,
          sub.usd_out as cumulative_usd_out
        from
          season s,
          lateral (
            select
              sum(bdv) as bdv_net,
              sum(case when bdv > 0 then bdv else 0 end) as bdv_in,
              sum(case when bdv < 0 then -bdv else 0 end) as bdv_out,
              sum(usd) as usd_net,
              sum(case when usd > 0 then usd else 0 end) as usd_in,
              sum(case when usd < 0 then -usd else 0 end) as usd_out
            from ${SILO_INFLOW_TABLE.env} f
            where f.block < s.block and f."isTransfer" = false
          ) as sub
          where s.season in (${seasonsIn})
      )
      select
        season,
        block,
        timestamp,
        cumulative_bdv_net,
        cumulative_bdv_in,
        cumulative_bdv_out,
        cumulative_usd_net,
        cumulative_usd_in,
        cumulative_usd_out,
        cumulative_bdv_net - lag(cumulative_bdv_net) over (order by block) as delta_bdv_net,
        cumulative_bdv_in - lag(cumulative_bdv_in) over (order by block) as delta_bdv_in,
        cumulative_bdv_out - lag(cumulative_bdv_out) over (order by block) as delta_bdv_out,
        cumulative_usd_net - lag(cumulative_usd_net) over (order by block) as delta_usd_net,
        cumulative_usd_in - lag(cumulative_usd_in) over (order by block) as delta_usd_in,
        cumulative_usd_out - lag(cumulative_usd_out) over (order by block) as delta_usd_out
      from
        cumulative
      order by timestamp asc
      `,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    // This occurs when the seasons table is missing a requested season. This is not recoverable
    // until the seasons table has that season added.
    if (results.length !== missingSeasons.length) {
      // Not strictly necessary to throw/block the rest of the task from progressing, however in practice
      // the only output of the inflow task is this snapshot, so its preferable to let it fall behind/trigger error logs
      throw new Error('Missing seasons detected when taking silo inflow snapshots');
    }

    const models = [];
    for (const result of results) {
      if (result.season === prevSeason) {
        continue;
      }
      const dto = SiloInflowSnapshotDto.fromLiveSnapshot(result);
      models.push(SiloInflowSnapshotAssembler.toModel(dto));
    }

    await SharedRepository.genericUpsert(sequelize.models.SiloInflowSnapshot, models, false);
  }

  static async findMissingSeasons(maxSeason) {
    return await SharedRepository.findMissingSeasons(SILO_INFLOW_SNAPSHOT_TABLE.env, maxSeason);
  }
}

module.exports = SiloInflowSnapshotService;
