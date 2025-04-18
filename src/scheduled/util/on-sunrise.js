const { C } = require('../../constants/runtime-constants');
const BeanstalkSubgraphRepository = require('../../repository/subgraph/beanstalk-subgraph');
const CommonSubgraphRepository = require('../../repository/subgraph/common-subgraph');
const { sendWebhookMessage } = require('../../utils/discord');

const DEFAULT_WAIT = 5.5 * 60 * 1000;
const CHECK_INTERVAL = 5000;

class OnSunriseUtil {
  static async failureCallback(maxWait) {
    await sendWebhookMessage(`Sunrise was not detected after ${maxWait / 1000} seconds!`);
  }

  // Waits until the subgraphs have processed this sunrise
  static async waitForSunrise(targetSeason, maxWait = DEFAULT_WAIT) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkSunrise = () => {
        // Separate async check function so error handling can be attached
        const check = async () => {
          const isSunriseProcessed = await OnSunriseUtil.checkSubgraphsForSunrise(targetSeason);
          const elapsedTime = Date.now() - startTime;

          if (isSunriseProcessed) {
            resolve();
          } else if (elapsedTime >= maxWait) {
            OnSunriseUtil.failureCallback(elapsedTime);
            reject(
              `One or more subgraphs didn't process sunrise within the expected time, or it didn't occur on-chain.`
            );
          } else {
            setTimeout(checkSunrise, CHECK_INTERVAL);
          }
        };
        check().catch((e) => {
          reject(`Error while checking for sunrise: ${e}`);
        });
      };
      checkSunrise();
    });
  }

  static async checkSubgraphsForSunrise(targetSeason) {
    const beanstalkSeason = await BeanstalkSubgraphRepository.getLatestSeason();
    if (parseInt(beanstalkSeason.season) >= targetSeason) {
      const newSeasonBlock = parseInt(beanstalkSeason.sunriseBlock);
      // See if bean, basin subgraphs are ready also
      const [beanMeta, basinMeta] = await Promise.all([
        CommonSubgraphRepository.getMeta(C().SG.BEAN),
        CommonSubgraphRepository.getMeta(C().SG.BASIN)
      ]);
      return Math.min(parseInt(beanMeta.block), parseInt(basinMeta.block)) >= newSeasonBlock;
    }
    return false;
  }
}

module.exports = OnSunriseUtil;
