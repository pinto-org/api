const { C } = require('../../constants/runtime-constants');
const SiloEvents = require('../../datasources/events/silo-events');
const SiloInflowDto = require('../../repository/dto/inflow/SiloInflowDto');
const PriceService = require('../../service/price-service');
const SiloService = require('../../service/silo-service');
const { BigInt_abs } = require('../../utils/bigint');
const { bigintFloatMultiplier, bigintPercent } = require('../../utils/number');

class SiloInflowsUtil {
  // Sums the net deposit/withdrawal for each token in these events, and identifies transfers.
  // A Transfer is identified as the same token being negative and positive for different accounts.
  // Partial transfers are reflected via the transferPct field.
  // i.e. -1000 pinto/+600 pinto, this is a 400 withdrawal and 600 transfer
  static netDeposits(addRemoveEvents) {
    const collapsed = SiloEvents.collapseDepositEvents(addRemoveEvents);
    const net = {};
    for (const e of collapsed) {
      (net[e.token] ??= {})[e.account] ??= {
        amount: 0n,
        bdv: 0n,
        transferPct: 0
      };
      net[e.token][e.account].amount += BigInt(e.type) * e.amount;
      net[e.token][e.account].bdv += BigInt(e.type) * e.bdv;
    }

    // Traverse withdrawals/deposits and assign transferPct
    for (const token in net) {
      const p = C().DECIMALS[token];
      const netWithdrawal = Object.values(net[token]).filter((e) => e.amount < 0n);
      const netDeposit = Object.values(net[token]).filter((e) => e.amount > 0n);
      for (let w = 0, d = 0; w < netWithdrawal.length && d < netDeposit.length; ) {
        const withdrawer = netWithdrawal[w];
        const depositor = netDeposit[d];

        const transferredW = bigintFloatMultiplier(BigInt_abs(withdrawer.amount), p, withdrawer.transferPct);
        const transferredD = bigintFloatMultiplier(depositor.amount, p, depositor.transferPct);
        const remainingW = BigInt_abs(withdrawer.amount) - transferredW;
        const remainingD = depositor.amount - transferredD;

        if (remainingW === remainingD) {
          withdrawer.transferPct = 1;
          depositor.transferPct = 1;
          ++w;
          ++d;
        } else if (remainingW > remainingD) {
          withdrawer.transferPct = bigintPercent(transferredW + remainingD, BigInt_abs(withdrawer.amount), p);
          depositor.transferPct = 1;
          ++d;
        } else {
          withdrawer.transferPct = 1;
          depositor.transferPct = bigintPercent(transferredD + remainingW, depositor.amount, p);
          ++w;
        }
      }
    }

    // Remove entries that ended up as zero
    for (const token in net) {
      for (const account in net[token]) {
        if (net[token][account].amount === 0n) {
          delete net[token][account];
        }
      }
      if (Object.keys(net[token]).length === 0) {
        delete net[token];
      }
    }
    return net;
  }

  // Assigns a pseudo bdv to each claim plenty event (the claimed tokens aren't whitelisted and don't have a bdv)
  static async assignClaimPlentyBdvs(claimPlenties, beanPrice, block) {
    // Price the value and bdvs of all claimed tokens
    const tokens = claimPlenties.map((e) => e.args.token.toLowerCase());
    const tokenPrices = (
      await Promise.all(tokens.map((t) => PriceService.getTokenPrice(t, { blockNumber: block })))
    ).map((p) => p.usdPrice);
    const pseudoBdvs = tokenPrices.map((p) => p / beanPrice);

    for (let i = 0; i < claimPlenties.length; ++i) {
      claimPlenties[i]._pseudoBdv = pseudoBdvs[i];
    }
  }

  // Calculates the net bdv inflow for each account
  static netBdvInflows(netDeposits, claimPlenties) {
    const net = {};
    for (const token in netDeposits) {
      for (const account in netDeposits[token]) {
        net[account] = (net[account] ?? 0n) + netDeposits[token][account].bdv;
        net.protocol = (net.protocol ?? 0n) + netDeposits[token][account].bdv;
      }
    }

    for (const e of claimPlenties) {
      const account = e.args.account.toLowerCase();
      net[account] = (net[account] ?? 0n) - e._pseudoBdv;
      net.protocol = (net.protocol ?? 0n) - e._pseudoBdv;
    }
    return net;
  }

  // Construct new silo inflow dtos from net deposits in this transaction
  static async inflowsFromNetDeposits(netDeposits, netFieldBdvInflows, { block, timestamp, txnHash, beanPrice }) {
    const dtos = [];
    for (const token in netDeposits) {
      const p = C().DECIMALS[token];
      for (const account in netDeposits[token]) {
        const deposit = netDeposits[token][account];
        const transfer = deposit.transferPct > 0;
        const partialTransfer = transfer && deposit.transferPct < 1;
        const data = {
          account,
          token,
          isPlenty: false,
          block,
          timestamp,
          txnHash
        };
        if (!partialTransfer) {
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: deposit.amount,
              isTransfer: transfer
            })
          );
        } else {
          // If this was partially transferred, needs to split into two entries
          const transferAmount = bigintFloatMultiplier(deposit.amount, p, deposit.transferPct);
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: transferAmount,
              isTransfer: true
            })
          );
          dtos.push(
            SiloInflowDto.fromData({
              ...data,
              amount: deposit.amount - transferAmount,
              isTransfer: false
            })
          );
        }
      }
    }

    // Assign all bdvs and usd values
    await this.assignInflowBdvAndUsd(dtos, netFieldBdvInflows, beanPrice, block);

    return dtos;
  }

  // Uses bdv batching view function to get many/all bdvs at once for this transaction
  static async assignInflowBdvAndUsd(dtos, netFieldBdvInflows, beanPrice, block) {
    const bdvsCalldata = {
      tokens: [],
      amounts: []
    };
    const signs = [];
    for (const dto of dtos) {
      bdvsCalldata.tokens.push(dto.token);
      bdvsCalldata.amounts.push(dto.amount * signs[signs.push(dto.amount > 0n ? 1n : -1n) - 1]);
    }
    const instBdvs = await SiloService.batchBdvs(bdvsCalldata, block);

    for (let i = 0; i < dtos.length; ++i) {
      dtos[i].assignInstValues(instBdvs[i] * signs[i], beanPrice, netFieldBdvInflows);
    }
  }

  static async inflowsFromClaimPlenties(claimPlenties, netFieldBdvInflows, { block, timestamp, txnHash, beanPrice }) {
    const dtos = [];
    for (let i = 0; i < claimPlenties.length; ++i) {
      const e = claimPlenties[i];
      const dto = SiloInflowDto.fromData({
        account: e.args.account.toLowerCase(),
        token: e.args.token.toLowerCase(),
        amount: -BigInt(e.args.plenty),
        isTransfer: false,
        isPlenty: true,
        block,
        timestamp,
        txnHash
      });
      const tokenAmount = fromBigInt(-BigInt(e.args.plenty), C().DECIMALS[e.args.token.toLowerCase()]);
      dto.assignInstValues(toBigInt(e._pseudoBdv * tokenAmount, 6), beanPrice, netFieldBdvInflows);
      dtos.push(dto);
    }
    return dtos;
  }
}
module.exports = SiloInflowsUtil;
