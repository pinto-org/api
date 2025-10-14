class FieldInflowsUtil {
  // Sums the net of field activity (in bdv) per account
  static netInflows(fieldEvents) {
    const net = {};
    const add = (account, bdv) => {
      account = account.toLowerCase();
      net[account] ??= {
        bdv: 0n
      };
      net[account].bdv += bdv;
    };
    for (const e of fieldEvents) {
      if (['Sow', 'Harvest'].includes(e.name)) {
        add(e.args.account, e.name === 'Sow' ? BigInt(e.args.beans) : -BigInt(e.args.beans));
      } else if (e.name === 'PodListingFilled') {
        add(e.args.filler, BigInt(e.args.costInBeans));
        add(e.args.lister, -BigInt(e.args.costInBeans));
      } else if (e.name === 'PodOrderFilled') {
        add(e.args.orderer, BigInt(e.args.costInBeans));
        add(e.args.filler, -BigInt(e.args.costInBeans));
      }
    }
    return net;
  }

  static async inflowsFromEvent(e) {
    const beanPrice = (await PriceService.getBeanPrice({ blockNumber: e.rawLog.blockNumber })).usdPrice;
    if (['Sow', 'Harvest'].includes(e.name)) {
      return [
        await this.inflowFromInfo(
          e,
          e.args.account.toLowerCase(),
          e.name === 'Sow' ? BigInt(e.args.beans) : -BigInt(e.args.beans),
          beanPrice,
          false
        )
      ];
    } else if (e.name === 'PodListingFilled') {
      return [
        await this.inflowFromInfo(e, e.args.filler.toLowerCase(), BigInt(e.args.costInBeans), beanPrice, true),
        await this.inflowFromInfo(e, e.args.lister.toLowerCase(), -BigInt(e.args.costInBeans), beanPrice, true)
      ];
    } else if (e.name === 'PodOrderFilled') {
      return [
        await this.inflowFromInfo(e, e.args.orderer.toLowerCase(), BigInt(e.args.costInBeans), beanPrice, true),
        await this.inflowFromInfo(e, e.args.filler.toLowerCase(), -BigInt(e.args.costInBeans), beanPrice, true)
      ];
    }
  }

  static async inflowFromInfo(e, account, beans, beanPrice, isMarket) {
    return FieldInflowDto.fromData({
      account,
      beans,
      usd: fromBigInt(beans, 6) * beanPrice,
      isMarket,
      block: e.rawLog.blockNumber,
      timestamp: e.extra.timestamp,
      txnHash: e.rawLog.transactionHash
    });
  }
}
module.exports = FieldInflowsUtil;
