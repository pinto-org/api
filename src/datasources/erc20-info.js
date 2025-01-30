const Contracts = require('./contracts/contracts');

const cachedInfo = {};

class ERC20Info {
  static async getTokenInfo(token) {
    if (!cachedInfo[token]) {
      const contract = Contracts.get(token);
      const [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()]);
      cachedInfo[token] = { address: token, name, symbol, decimals };
    }
    return cachedInfo[token];
  }
}
module.exports = ERC20Info;
