const ERC20Info = require('../../../datasources/erc20-info');

// Formats exchange route responses according to the respective API documentation
// CG:  https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
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

  static getAssetsCMC() {
    return {
      PINTO: {
        name: 'Pinto',
        unified_cryptoasset_id: undefined,
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0xb170000aeeFa790fa61D6e837d1035906839a3c8',
        contractAddress: '0xb170000aeeFa790fa61D6e837d1035906839a3c8'
      },
      WETH: {
        name: 'Wrapped Ether',
        unified_cryptoasset_id: '2396',
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0x4200000000000000000000000000000000000006',
        contractAddress: '0x4200000000000000000000000000000000000006'
      },
      cbETH: {
        name: 'Coinbase Wrapped Staked ETH',
        unified_cryptoasset_id: '21535',
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
        contractAddress: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22'
      },
      cbBTC: {
        name: 'Coinbase Wrapped BTC',
        unified_cryptoasset_id: '32994',
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'
      },
      SOL: {
        name: 'Wrapped SOL',
        unified_cryptoasset_id: undefined,
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0x1C61629598e4a901136a81BC138E5828dc150d67',
        contractAddress: '0x1C61629598e4a901136a81BC138E5828dc150d67'
      },
      USDC: {
        name: 'USD Coin',
        unified_cryptoasset_id: '3408',
        can_withdraw: true,
        can_deposit: true,
        maker_fee: '0.00',
        taker_fee: '0.00',
        contractAddressUrl: 'https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }
    };
  }

  // async due to using ERC20Info, which resolves instantly if cached
  static async formatYieldsCMC({ poolYields, poolPriceInfo }) {
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
