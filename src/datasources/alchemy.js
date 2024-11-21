const { Alchemy } = require('alchemy-sdk');
const EnvUtil = require('../utils/env');
const { ethers } = require('ethers');

class AlchemyUtil {
  // Contains a provider by chain
  static _providers = {};
  // Access to the underlying promise whos execution populates _providers.
  // Allows flexibility in awaiting when necessary (i.e. once at application startup)
  static _providerPromises = {};

  static {
    for (const chain of EnvUtil.getEnabledChains()) {
      if (EnvUtil.getCustomRpcUrl(chain)) {
        this._providers[chain] = new ethers.JsonRpcProvider(EnvUtil.getCustomRpcUrl(chain));
        // Needed to get Contract constructor to work
        this._providers[chain]._isProvider = true;
      } else {
        const settings = {
          apiKey: EnvUtil.getAlchemyKey(),
          network: `${chain}-mainnet` // Of type alchemy-sdk.Network
        };
        const alchemy = new Alchemy(settings);
        this._providerPromises[chain] = alchemy.config.getProvider().then((p) => {
          this._providers[chain] = p;
        });
      }
    }
  }

  static providerForChain(chain) {
    return AlchemyUtil._providers[chain];
  }

  // Returns immediately if already resolved (and _providers is populated)
  static async ready(chain) {
    await AlchemyUtil._providerPromises[chain];
  }
}

module.exports = AlchemyUtil;
