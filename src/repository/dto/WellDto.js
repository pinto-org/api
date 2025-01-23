const NumberUtil = require('../../utils/number');

class WellDto {
  static subgraphFields = `
    id
    tokens {
      id
      decimals
    }
    tokenOrder
    reserves
    symbol
    tokenPrice
    rollingDailyBiTradeVolumeReserves
    wellFunction {
      id
    }
    wellFunctionData
  `;

  constructor(sg) {
    this.address = sg.id;
    this.symbol = sg.symbol;
    this.tokens = this.#orderedTokens(sg.tokens, sg.tokenOrder);
    this.rates = NumberUtil.createNumberSpread(sg.tokenPrice.map(BigInt), this.tokenDecimals());
    this.reserves = NumberUtil.createNumberSpread(sg.reserves.map(BigInt), this.tokenDecimals());
    this.biTokenVolume24h = NumberUtil.createNumberSpread(
      sg.rollingDailyBiTradeVolumeReserves.map(BigInt),
      this.tokenDecimals()
    );
    this.wellFunction = {
      id: sg.wellFunction.id,
      data: sg.wellFunctionData
    };
  }

  tokenDecimals() {
    return this.tokens.map((t) => t.decimals);
  }

  // Orders the tokens with the provided order.
  #orderedTokens(tokens, tokenOrder) {
    if (!tokens || !tokenOrder || !tokens[0].id) {
      throw new Error(`Can't order tokens with the provided fields.`);
    }
    const tokenOrderMap = tokenOrder.reduce((a, next, idx) => {
      a[next] = idx;
      return a;
    }, {});
    tokens.sort((a, b) => tokenOrderMap[a.id] - tokenOrderMap[b.id]);
    return tokens.map((t) => ({
      address: t.id,
      decimals: t.decimals
    }));
  }
}

module.exports = WellDto;
