// Formats exchange route responses according to the respective API documentation
// CG:  https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit
// CMC: https://docs.google.com/document/d/1S4urpzUnO2t7DmS_1dc4EL4tgnnbTObPYXvDeBnukCg/edit
class ExchangeResponseFormatter {
  static formatTickersCG(tickers) {
    return tickers.map((t) => ({
      ticker_id: `${t.beanToken}_${t.nonBeanToken}`,
      base_currency: t.beanToken,
      target_currency: t.nonBeanToken,
      pool_id: t.wellAddress,
      last_price: t.exchangeRates.float[1],
      base_volume: t.tokenVolume24h.float[0],
      target_volume: t.tokenVolume24h.float[1],
      liquidity_in_usd: t.liquidityUSD,
      depth2: t.depth2,
      high: t.high.float[1],
      low: t.low.float[1]
    }));
  }

  // wellAddress: well.address,
  //         beanToken,
  //         nonBeanToken,
  //         exchangeRates: well.rates,
  //         tokenVolume24h: well.biTokenVolume24h,
  //         tradeVolume24h: well.tradeVolume24h,
  //         liquidityUSD: parseFloat(poolLiquidity.toFixed(0)),
  //         depth2: {
  //           buy: depth2.buy.float,
  //           sell: depth2.sell.float
  //         },
  //         high: priceRange.high,
  //         low: priceRange.low

  static formatTickersCMC(tickers) {
    return tickers.map((t) => ({
      //
    }));
  }
}
module.exports = ExchangeResponseFormatter;
