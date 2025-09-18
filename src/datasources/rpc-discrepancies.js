// This utility is used to manage discrepancies between different RPC providers (i.e. local anvil vs prod)
class RpcDiscrepancies {
  static effectiveGasPriceBI(receipt) {
    if (receipt.effectiveGasPrice !== undefined && receipt.effectiveGasPrice !== null) {
      return BigInt(receipt.effectiveGasPrice);
    }
    return receipt.gasPrice;
  }

  static logIndex(rawLog) {
    return rawLog.logIndex ?? rawLog.index;
  }
}
module.exports = RpcDiscrepancies;
