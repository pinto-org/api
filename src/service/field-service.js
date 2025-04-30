const Contracts = require('../datasources/contracts/contracts');
const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');
const { BigInt_min, BigInt_max } = require('../utils/bigint');
const { toBigInt, fromBigInt } = require('../utils/number');

const BUCKET_SIZE = 10000;

class FieldService {
  // TODO: consider parameter for it only starting with the current front of line, or for harvested plots only.
  static async getAggregatePlotSummary(bucketSize = BUCKET_SIZE) {
    const [plots, harvestableIndex] = await Promise.all([
      BeanstalkSubgraphRepository.getAllPlots(),
      (async () => BigInt(await Contracts.getBeanstalk().harvestableIndex(0)))()
    ]);
    console.log(plots.length, plots[0], harvestableIndex); //

    const results = [];
    // avgAPR: 0 // TODO: apr for harvested

    let currentResult = null;
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i];
      const plotEnd = plot.index + plot.pods;
      if (!currentResult) {
        currentResult = {
          startSeason: plot.sowSeason,
          startTimestamp: plot.sowTimestamp,
          startIndex: plot.index,
          endIndex: plot.index + toBigInt(bucketSize, 6),
          avgSownBeansPerPod: 0,
          numPlots: 0
        };
      }
      const addedPods = BigInt_min(currentResult.endIndex, plotEnd) - BigInt_max(currentResult.startIndex, plot.index);
      currentResult.avgSownBeansPerPod += fromBigInt(plot.sownBeansPerPod, 6) * (fromBigInt(addedPods, 6) / bucketSize);
      currentResult.numPlots++;

      while (plotEnd >= currentResult.endIndex) {
        currentResult.endSeason = plot.sowSeason;
        currentResult.endTimestamp = plot.sowTimestamp;
        results.push(currentResult);

        if (plotEnd > currentResult.endIndex) {
          const oldBucketEnd = currentResult.endIndex;
          const newBucketEnd = oldBucketEnd + toBigInt(bucketSize, 6);
          const spilloverPods = BigInt_min(newBucketEnd, plotEnd) - oldBucketEnd;
          currentResult = {
            startSeason: plot.sowSeason,
            startTimestamp: plot.sowTimestamp,
            startIndex: oldBucketEnd,
            endIndex: newBucketEnd,
            avgSownBeansPerPod: fromBigInt(plot.sownBeansPerPod, 6) * (fromBigInt(spilloverPods, 6) / bucketSize),
            numPlots: 1
          };
        } else {
          currentResult = null;
          break;
        }
      }

      if (i === plots.length - 1) {
        currentResult.endIndex = plotEnd;
        currentResult.endSeason = plot.sowSeason;
        currentResult.endTimestamp = plot.sowTimestamp;
        currentResult.avgSownBeansPerPod *=
          bucketSize / fromBigInt(currentResult.endIndex - currentResult.startIndex, 6);
        results.push(currentResult);
      }
    }
    return results;
  }
}
module.exports = FieldService;
