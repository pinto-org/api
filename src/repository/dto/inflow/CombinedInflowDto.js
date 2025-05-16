class CombinedInflowDto {
  constructor(row) {
    this.season = row.season;
    this.all = {
      cumulative: {
        usdNet: row.all_cumulative_usd_net,
        usdIn: row.all_cumulative_usd_in,
        usdOut: row.all_cumulative_usd_out,
        usdVolume: row.all_cumulative_usd_volume
      },
      delta: {
        usdNet: row.all_delta_usd_net,
        usdIn: row.all_delta_usd_in,
        usdOut: row.all_delta_usd_out,
        usdVolume: row.all_delta_usd_volume
      }
    };
    this.silo = {
      cumulative: {
        usdNet: row.silo_cumulative_usd_net,
        usdIn: row.silo_cumulative_usd_in,
        usdOut: row.silo_cumulative_usd_out,
        usdVolume: row.silo_cumulative_usd_volume
      },
      delta: {
        usdNet: row.silo_delta_usd_net,
        usdIn: row.silo_delta_usd_in,
        usdOut: row.silo_delta_usd_out,
        usdVolume: row.silo_delta_usd_volume
      }
    };
    this.field = {
      cumulative: {
        usdNet: row.field_cumulative_usd_net,
        usdIn: row.field_cumulative_usd_in,
        usdOut: row.field_cumulative_usd_out,
        usdVolume: row.field_cumulative_usd_volume
      },
      delta: {
        usdNet: row.field_delta_usd_net,
        usdIn: row.field_delta_usd_in,
        usdOut: row.field_delta_usd_out,
        usdVolume: row.field_delta_usd_volume
      }
    };
  }

  static fromRow(row) {
    return new CombinedInflowDto(row);
  }
}

module.exports = CombinedInflowDto;
