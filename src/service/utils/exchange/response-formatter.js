// Formats exchange route responses according to the respective API documentation
// CG:  https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit

const BeanstalkPrice = require('../../../datasources/contracts/upgradeable/beanstalk-price');
const ERC20Info = require('../../../datasources/erc20-info');
const { fromBigInt } = require('../../../utils/number');

// CMC: https://docs.google.com/document/d/1S4urpzUnO2t7DmS_1dc4EL4tgnnbTObPYXvDeBnukCg/edit
class ExchangeResponseFormatter {
  static formatTickersCG(tickers) {
    return tickers.map((t) => ({
      ticker_id: `${t.beanToken.address}_${t.nonBeanToken.address}`,
      base_currency: t.beanToken.address,
      target_currency: t.nonBeanToken.address,
      pool_id: t.wellAddress,
      last_price: t.exchangeRates[1],
      base_volume: t.tokenVolume24h.float[0],
      target_volume: t.tokenVolume24h.float[1],
      liquidity_in_usd: t.liquidityUSD,
      depth2: t.depth2,
      high: t.high[1],
      low: t.low[1]
    }));
  }

  static formatTickersCMC(tickers) {
    return tickers.reduce((acc, t) => {
      acc[`${t.beanToken.address}_${t.nonBeanToken.address}`] = {
        base_id: t.beanToken.address,
        base_name: t.beanToken.name,
        base_symbol: t.beanToken.symbol,
        quote_id: t.nonBeanToken.address,
        quote_name: t.nonBeanToken.name,
        quote_symbol: t.nonBeanToken.symbol,
        last_price: t.exchangeRates[1],
        base_volume: t.tokenVolume24h.float[0],
        quote_volume: t.tokenVolume24h.float[1],
        // Not required fields but we provide them anyway
        liquidity_in_usd: t.liquidityUSD,
        depth2: t.depth2,
        high: t.high[1],
        low: t.low[1]
      };
      return acc;
    }, {});
  }

  static async formatYieldsCMC(poolYields) {
    const price = await new BeanstalkPrice().price({ skipTransform: true });
    const poolPriceInfo = price.ps.reduce((acc, next) => {
      acc[next.pool.toLowerCase()] = {
        nonBeanToken: next.tokens[1],
        liquidity: fromBigInt(BigInt(next.liquidity), 6)
      };
      return acc;
    }, {});

    return {
      provider: 'Pinto',
      provider_logo: 'https://assets.pinto.money/tokens/PINTO_72x72.png',
      provider_URL: 'https://pinto.money/',
      links: [
        { title: 'X', link: 'https://x.com/pintocommunity' },
        { title: 'Discord', link: 'https://pinto.money/discord' },
        { title: 'Telegram', link: 'https://t.me/pintoannouncements' },
        { title: 'GitHub', link: 'https://github.com/pinto-org' }
      ],
      pools: await Promise.all(
        Object.keys(poolPriceInfo).map(async (pool) => {
          const lpToken = await ERC20Info.getTokenInfo(pool);
          const nonBeanToken = await ERC20Info.getTokenInfo(poolPriceInfo[pool].nonBeanToken);
          return {
            name: lpToken.name,
            pair: `PINTO-${nonBeanToken.symbol}`,
            pairLink: `https://pinto.exchange/#/wells/8453/${pool}`,
            logo: `https://assets.pinto.money/tokens/PINTO${nonBeanToken.symbol}_72x72.png`,
            poolRewards: ['PINTO'],
            apr: poolYields[pool].bean,
            totalStaked: parseInt(poolPriceInfo[pool].liquidity.toFixed(0))
          };
        })
      )
    };
  }
}
module.exports = ExchangeResponseFormatter;
