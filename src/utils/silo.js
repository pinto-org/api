const { ethers } = require('ethers');
const Contracts = require('../datasources/contracts/contracts');
const EVM = require('../datasources/evm');
const { C } = require('../constants/runtime-constants');

class SiloUtil {
  static async calcStalkDriftAmount(account, blockTag = 'latest') {
    const [depositResult, storageResult] = await Promise.all([
      this.calcDepositStalkBalance(account, blockTag),
      this.getStorageStalkBalance(account, blockTag)
    ]);
    const diff = storageResult.inclGerminating - depositResult.total;
    if (diff !== 0n) {
      // console.log('nonzero diff from:');
      // console.log(depositResult);
      // console.log(storageResult);
    }
    return storageResult.inclGerminating - depositResult.total;
  }

  static async calcDepositStalkBalance(account, blockTag = 'latest') {
    const beanstalk = Contracts.getBeanstalk();
    const deposits = await beanstalk.getDepositsForAccount({ target: 'SuperContract', skipTransform: true }, account, {
      blockTag
    });

    let stalkResult = { total: 0n };
    for (let i = 0; i < deposits.length; ++i) {
      const d = deposits[i];
      if (d.depositIds.length > 0) {
        stalkResult[d.token] = 0n;
        const mowStem = BigInt(await beanstalk.getLastMowedStem(account, d.token, { blockTag }));
        for (let j = 0; j < d.depositIds.length; ++j) {
          const depositedBdv = BigInt(d.tokenDeposits[j][1]);
          const { stem: depositStem } = SiloUtil.unpackDepositId(BigInt(d.depositIds[j]));
          const stemDelta = mowStem - depositStem;
          const grownStalkClaimed = depositedBdv * stemDelta;
          const depositStalk = depositedBdv * BigInt(10 ** 10) + grownStalkClaimed;

          stalkResult[d.token] += depositStalk;
          stalkResult.total += depositStalk;
        }
      }
    }
    return stalkResult;
  }

  static async getStorageStalkBalance(account, blockTag = 'latest') {
    const { bs } = EVM.beanstalkContractAndStorage(C(), blockTag);
    const storageStalk = BigInt(await bs.s.accts[account].stalk);
    const germinatingOdd = BigInt(await bs.s.accts[account].germinatingStalk[0]);
    const germinatingEven = BigInt(await bs.s.accts[account].germinatingStalk[1]);
    return {
      raw: storageStalk,
      inclGerminating: storageStalk + germinatingOdd + germinatingEven
    };
  }

  static unpackDepositId(id) {
    // id is expected to be a BigInt
    const addressMask = (1n << 160n) - 1n;
    const stemMask = (1n << 96n) - 1n;

    const address = (id >> 96n) & addressMask;
    let stem = id & stemMask;

    // Convert to signed 96-bit integer
    if (stem >= 1n << 95n) {
      stem -= 1n << 96n;
    }

    const ethAddress = ethers.getAddress('0x' + address.toString(16).padStart(40, '0'));

    return { address: ethAddress, stem };
  }
}
module.exports = SiloUtil;
