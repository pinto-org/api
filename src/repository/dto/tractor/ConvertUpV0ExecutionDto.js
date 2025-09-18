class ConvertUpV0ExecutionDto {
  // TODO: expand this
  constructor(type, d) {
    if (type === 'data') {
      const { baseExecutionDto, innerEvents } = d;

      this.id = baseExecutionDto.id;
      this.blueprintHash = baseExecutionDto.blueprintHash;
      // TBD
    } else if (type === 'db') {
      this.id = d.id;
      this.blueprintHash = d.blueprintHash;
      // Fields TBD
      this.usedTokens = d.usedTokenIndices
        .split(',')
        .map(Number)
        .map((index) => BlueprintConstants.tokenIndexReverseMap()[index]);
    }
  }

  static async fromExecutionContext(convertExecutionContext) {
    const convertExecutionDto = new ConvertUpV0ExecutionDto('data', convertExecutionContext);
    return convertExecutionDto;
  }

  static fromModel(dbModel) {
    return new ConvertUpV0ExecutionDto('db', dbModel);
  }

  // This will be similar to sowing but no need to check the grown stalk withdraw part
  // Still can consider using generalized logic somewhere
  async determineWithdrawnTokens(innerEvents) {
    // const removeDeposits = innerEvents.filter((e) => ['RemoveDeposits', 'RemoveDeposit'].includes(e.name));
    // let totalBdvWithdrawn = 0;
    // let totalGrownStalkWithdrawn = 0;
    // this.usedTokens = [];
    // for (const evt of removeDeposits) {
    //   const token = evt.args.token.toLowerCase();
    //   if (!this.usedTokens.includes(token) && token in BlueprintConstants.tokenIndexMap()) {
    //     this.usedTokens.push(token);
    //   }
    //   // Support both RemoveDeposits and RemoveDeposit
    //   const bdvs = (evt.args.bdvs ?? [evt.args.bdv]).map(BigInt);
    //   const stems = (evt.args.stems ?? [evt.args.stem]).map(BigInt);
    //   const stemTip = BigInt(
    //     await Contracts.getBeanstalk().stemTipForToken(token, { blockTag: evt.rawLog.blockNumber })
    //   );
    //   for (let i = 0; i < bdvs.length; i++) {
    //     totalBdvWithdrawn += fromBigInt(bdvs[i], 6);
    //     totalGrownStalkWithdrawn += fromBigInt(bdvs[i] * (stemTip - stems[i]), 16);
    //   }
    // }
    // this.usedGrownStalkPerBdv = totalGrownStalkWithdrawn / totalBdvWithdrawn;
  }
}

module.exports = ConvertUpV0ExecutionDto;
