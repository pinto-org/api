const Contracts = require('../../datasources/contracts/contracts');
const FieldInflowDto = require('../../repository/dto/inflow/FieldInflowDto');
const { toBigInt, fromBigInt } = require('../../utils/number');

class FieldInflowsUtil {
  // Previously there was a bug in the Sow event emission such that the amount of beans indicated
  // was actually the amount of soil reduced. This occurred during the morning when above peg.
  // The true amount of beans sown is computed here and attached as a _beansSown field.
  static async assignTrueBeansSown(sowEvents, block) {
    const beanstalk = Contracts.getBeanstalk();
    const temperature = await beanstalk.temperature({ blockTag: block });

    for (const e of sowEvents) {
      e._beansSown = toBigInt(fromBigInt(BigInt(e.args.pods), 6) / (1 + fromBigInt(temperature, 6 + 2)), 6);
    }
  }

  // Calculates the net bdv inflow for each account
  static netBdvInflows(fieldEvents) {
    const net = {};
    const add = (account, bdv) => {
      account = account.toLowerCase();
      net[account] = (net[account] ?? 0n) + bdv;
      net.protocol = (net.protocol ?? 0n) + bdv;
    };
    for (const e of fieldEvents) {
      if (['Sow', 'Harvest'].includes(e.name)) {
        add(e.args.account, e.name === 'Sow' ? e._beansSown : -BigInt(e.args.beans));
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

  static inflowsFromFieldEvents(fieldEvents, netSiloBdvInflows, { block, timestamp, txnHash, beanPrice }) {
    const sowHarvest = fieldEvents.filter((e) => ['Sow', 'Harvest'].includes(e.name));
    const market = fieldEvents.filter((e) => ['PodListingFilled', 'PodOrderFilled'].includes(e.name));

    const netSowHarvest = {};
    for (const e of sowHarvest) {
      netSowHarvest[e.args.account.toLowerCase()] =
        (netSowHarvest[e.args.account.toLowerCase()] ?? 0n) + (e.name === 'Sow' ? e._beansSown : -BigInt(e.args.beans));
    }

    const netMarket = {};
    for (const e of market) {
      if (e.name === 'PodListingFilled') {
        netMarket[e.args.filler.toLowerCase()] =
          (netMarket[e.args.filler.toLowerCase()] ?? 0n) + BigInt(e.args.costInBeans);
        netMarket[e.args.lister.toLowerCase()] =
          (netMarket[e.args.lister.toLowerCase()] ?? 0n) - BigInt(e.args.costInBeans);
      } else if (e.name === 'PodOrderFilled') {
        netMarket[e.args.orderer.toLowerCase()] =
          (netMarket[e.args.orderer.toLowerCase()] ?? 0n) + BigInt(e.args.costInBeans);
        netMarket[e.args.filler.toLowerCase()] =
          (netMarket[e.args.filler.toLowerCase()] ?? 0n) - BigInt(e.args.costInBeans);
      }
    }

    const inputs = [];
    for (const account in netSowHarvest) {
      inputs.push({ account, beans: netSowHarvest[account], isMarket: false });
    }
    for (const account in netMarket) {
      inputs.push({ account, beans: netMarket[account], isMarket: true });
    }

    const dtos = [];
    for (const { account, beans, isMarket } of inputs) {
      dtos.push(
        FieldInflowDto.fromData({ account, beans, beanPrice, isMarket, block, timestamp, txnHash }, netSiloBdvInflows)
      );
    }
    return dtos;
  }
}
module.exports = FieldInflowsUtil;
