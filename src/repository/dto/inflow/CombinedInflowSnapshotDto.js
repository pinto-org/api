class CombinedInflowSnapshotDto {
  constructor(row) {
    this.season = row.season;
    this.snapshotBlock = row.snapshotBlock;
    this.snapshotTimestamp = row.snapshotTimestamp;
    this.all = {
      cumulative: {
        net: row.all_cumulative_usd_net,
        in: row.all_cumulative_usd_in,
        out: row.all_cumulative_usd_out,
        volume: row.all_cumulative_usd_volume
      },
      delta: {
        net: row.all_delta_usd_net,
        in: row.all_delta_usd_in,
        out: row.all_delta_usd_out,
        volume: row.all_delta_usd_volume
      }
    };
    this.silo = {
      cumulative: {
        net: row.silo_cumulative_usd_net,
        in: row.silo_cumulative_usd_in,
        out: row.silo_cumulative_usd_out,
        volume: row.silo_cumulative_usd_volume
      },
      delta: {
        net: row.silo_delta_usd_net,
        in: row.silo_delta_usd_in,
        out: row.silo_delta_usd_out,
        volume: row.silo_delta_usd_volume
      }
    };
    this.field = {
      cumulative: {
        net: row.field_cumulative_usd_net,
        in: row.field_cumulative_usd_in,
        out: row.field_cumulative_usd_out,
        volume: row.field_cumulative_usd_volume
      },
      delta: {
        net: row.field_delta_usd_net,
        in: row.field_delta_usd_in,
        out: row.field_delta_usd_out,
        volume: row.field_delta_usd_volume
      }
    };

    for (const k1 of ['all', 'silo', 'field']) {
      for (const k2 of ['cumulative', 'delta']) {
        for (const k3 of ['net', 'in', 'out', 'volume']) {
          this[k1][k2][k3] = Math.trunc(this[k1][k2][k3] * 100) / 100;
        }
      }
    }
  }

  static fromRow(row) {
    return new CombinedInflowSnapshotDto(row);
  }
}

module.exports = CombinedInflowSnapshotDto;
