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
      last_price: t.exchangeRates.float[1],
      base_volume: t.tokenVolume24h.float[0],
      target_volume: t.tokenVolume24h.float[1],
      liquidity_in_usd: t.liquidityUSD,
      depth2: t.depth2,
      high: t.high.float[1],
      low: t.low.float[1]
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
        last_price: t.exchangeRates.float[1],
        base_volume: t.tokenVolume24h.float[0],
        quote_volume: t.tokenVolume24h.float[1],
        // Not required fields but we provide them anyway
        liquidity_in_usd: t.liquidityUSD,
        depth2: t.depth2,
        high: t.high.float[1],
        low: t.low.float[1]
      };
      return acc;
    }, {});
  }
}
module.exports = ExchangeResponseFormatter;
