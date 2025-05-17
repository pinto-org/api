const FieldInflowSnapshotDto = require('../../repository/dto/inflow/FieldInflowSnapshotDto');
const SeasonDto = require('../../repository/dto/SeasonDto');
const { sequelize } = require('../../repository/postgres/models');
const FieldInflowSnapshotAssembler = require('../../repository/postgres/models/assemblers/inflow/field-inflow-snapshot-assembler');
const SeasonRepository = require('../../repository/postgres/queries/season-repository');
const SharedRepository = require('../../repository/postgres/queries/shared-repository');
const AsyncContext = require('../../utils/async/context');

class FieldInflowSnapshotService {
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
          sub.beans_net as cumulative_beans_net,
          sub.beans_in as cumulative_beans_in,
          sub.beans_out as cumulative_beans_out,
          sub.usd_net as cumulative_usd_net,
          sub.usd_in as cumulative_usd_in,
          sub.usd_out as cumulative_usd_out
        from
          season s,
          lateral (
            select
              sum(beans) as beans_net,
              sum(case when beans > 0 then beans else 0 end) as beans_in,
              sum(case when beans < 0 then -beans else 0 end) as beans_out,
              sum(usd) as usd_net,
              sum(case when usd > 0 then usd else 0 end) as usd_in,
              sum(case when usd < 0 then -usd else 0 end) as usd_out
            from field_inflow f
            where f.block < s.block and f."isMarket" = false
          ) as sub
          where s.season in (${seasonsIn})
      )
      select
        season,
        block,
        timestamp,
        cumulative_beans_net,
        cumulative_beans_in,
        cumulative_beans_out,
        cumulative_usd_net,
        cumulative_usd_in,
        cumulative_usd_out,
        cumulative_beans_net - lag(cumulative_beans_net) over (order by block) as delta_beans_net,
        cumulative_beans_in - lag(cumulative_beans_in) over (order by block) as delta_beans_in,
        cumulative_beans_out - lag(cumulative_beans_out) over (order by block) as delta_beans_out,
        cumulative_usd_net - lag(cumulative_usd_net) over (order by block) as delta_usd_net,
        cumulative_usd_in - lag(cumulative_usd_in) over (order by block) as delta_usd_in,
        cumulative_usd_out - lag(cumulative_usd_out) over (order by block) as delta_usd_out
      from
        cumulative
      order by timestamp asc
      `,
      { transaction: AsyncContext.getOrUndef('transaction') }
    );

    const models = [];
    for (const result of results) {
      if (result.season === prevSeason) {
        continue;
      }
      const dto = FieldInflowSnapshotDto.fromLiveSnapshot(result);
      models.push(FieldInflowSnapshotAssembler.toModel(dto));
    }

    await SharedRepository.genericUpsert(sequelize.models.FieldInflowSnapshot, models, false);
  }

  static async findMissingSeasons(maxSeason) {
    return await SharedRepository.findMissingSeasons('field_inflow_snapshot', maxSeason);
  }
}

module.exports = FieldInflowSnapshotService;
