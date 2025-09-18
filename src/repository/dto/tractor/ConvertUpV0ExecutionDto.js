const PriceService = require('../../../service/price-service');
const BlueprintConstants = require('../../../service/tractor/blueprints/blueprint-constants');

class ConvertUpV0ExecutionDto {
  constructor(type, d) {
    if (type === 'data') {
      const { baseExecutionDto, innerEvents } = d;

      this.id = baseExecutionDto.id;
      this.blueprintHash = baseExecutionDto.blueprintHash;

      const convertEvts = innerEvents.filter((e) => e.name === 'Convert');
      this.usedTokens = [];
      this.tokenFromAmounts = [];
      this.tokenToAmounts = [];
      for (const evt of convertEvts) {
        const token = evt.args.fromToken.toLowerCase();
        if (!this.usedTokens.includes(token)) {
          this.usedTokens.push(token);
          this.tokenFromAmounts.push(BigInt(evt.args.fromAmount));
          this.tokenToAmounts.push(BigInt(evt.args.toAmount));
        } else {
          const tokenIdx = this.usedTokens.indexOf(token);
          this.tokenFromAmounts[tokenIdx] += BigInt(evt.args.fromAmount);
          this.tokenToAmounts[tokenIdx] += BigInt(evt.args.toAmount);
        }
      }
      this.beansConverted = convertEvts.reduce((acc, next) => acc + BigInt(next.args.toAmount), 0n);
      // beanPriceBefore, beanPriceAfter set async
      const convertUpBonusEvts = innerEvents.filter((e) => e.name === 'ConvertUpBonus');
      this.gsBonusAmount = convertUpBonusEvts.reduce((acc, next) => acc + BigInt(next.args.grownStalkGained), 0n);
      this.gsBonusBdv = convertUpBonusEvts.reduce((acc, next) => acc + BigInt(next.args.bdvCapacityUsed), 0n);
      this.gsPenaltyAmount = 0n;
      this.gsPenaltyBdv = 0n;
    } else if (type === 'db') {
      this.id = d.id;
      this.blueprintHash = d.blueprintHash;
      this.usedTokens = d.usedTokenIndices
        .split(',')
        .map(Number)
        .map((index) => BlueprintConstants.tokenIndexReverseMap()[index]);
      this.tokenFromAmounts = d.tokenFromAmounts.split(',').map(BigInt);
      this.tokenToAmounts = d.tokenToAmounts.split(',').map(BigInt);
      this.beansConverted = d.beansConverted;
      this.beanPriceBefore = d.beanPriceBefore;
      this.beanPriceAfter = d.beanPriceAfter;
      this.gsBonusAmount = d.gsBonusAmount;
      this.gsBonusBdv = d.gsBonusBdv;
      this.gsPenaltyAmount = d.gsPenaltyAmount;
      this.gsPenaltyBdv = d.gsPenaltyBdv;
    }
  }

  static async fromExecutionContext(convertExecutionContext) {
    const convertExecutionDto = new ConvertUpV0ExecutionDto('data', convertExecutionContext);

    // Assign before/after prices
    const executionBlock = convertExecutionContext.innerEvents[0].rawLog.blockNumber;
    convertExecutionDto.beanPriceBefore = (
      await PriceService.getBeanPrice({ blockNumber: executionBlock - 1 })
    ).usdPrice;
    convertExecutionDto.beanPriceAfter = (await PriceService.getBeanPrice({ blockNumber: executionBlock })).usdPrice;

    return convertExecutionDto;
  }

  static fromModel(dbModel) {
    return new ConvertUpV0ExecutionDto('db', dbModel);
  }
}

module.exports = ConvertUpV0ExecutionDto;
