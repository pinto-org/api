class PlotDto {
  static subgraphFields = `
    id
    index
    pods
    sownBeansPerPod
    sowSeason
    sowTimestamp
    harvestAt
  `;

  constructor(sg) {
    this.id = sg.id;
    this.index = BigInt(sg.index);
    this.pods = BigInt(sg.pods);
    this.sownBeansPerPod = BigInt(sg.sownBeansPerPod);
    this.sowSeason = sg.sowSeason;
    this.sowTimestamp = new Date(Number(sg.sowTimestamp) * 1000);
    this.harvestAt = sg.harvestAt ? new Date(Number(sg.harvestAt) * 1000) : null;
  }

  static fromSubgraph(sg) {
    return new PlotDto(sg);
  }
}
module.exports = PlotDto;
