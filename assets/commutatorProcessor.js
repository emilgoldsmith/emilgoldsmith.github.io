class CommutatorProcessor {
  constructor() {
    const oneTurn = String.raw`[ULFRDB]2?'?`;
    const mainPart = String.raw`\[((?:${oneTurn} )*(?:${oneTurn})), ((?:${oneTurn} )*(?:${oneTurn}))\]`;
    const rotations = String.raw`[xyz]'?`;
    const withSetup = String.raw`\[((?:${oneTurn} |${rotations} )*(?:${oneTurn}|${rotations})): ${mainPart}\]`;
    const toReg = (x) => new RegExp(x);
    this.pureCommutatorRegex = toReg(`^${mainPart}$`);
    this.commutatorWithSetupRegex = toReg(`^${withSetup}$`);
  }

  validateCommutator(commutator) {
    return (
      this.pureCommutatorRegex.test(commutator) ||
      this.commutatorWithSetupRegex.test(commutator)
    );
  }

  inverseCommutator(commutator) {
    const pureCommutatorMatch = commutator.match(this.pureCommutatorRegex);
    const commutatorWithSetupMatch = commutator.match(
      this.commutatorWithSetupRegex
    );
    if (pureCommutatorMatch) {
      return `[${pureCommutatorMatch[2]}, ${pureCommutatorMatch[1]}]`;
    }
    const inverseMainPart = `[${commutatorWithSetupMatch[3]}, ${commutatorWithSetupMatch[2]}]`;
    const setupMoves = commutatorWithSetupMatch[1];
    return `[${setupMoves}: ${inverseMainPart}]`;
  }

  asSequenceOfMoves(commutator) {
    const pureCommutatorMatch = commutator.match(this.pureCommutatorRegex);
    const commutatorWithSetupMatch = commutator.match(
      this.commutatorWithSetupRegex
    );
    if (pureCommutatorMatch) {
      return this.__pureCommutatorAsSequenceOfMoves(
        pureCommutatorMatch.slice(1, 3)
      );
    }
    const mainAlg = this.__pureCommutatorAsSequenceOfMoves(
      commutatorWithSetupMatch.slice(2, 4)
    );
    const setupMoves = commutatorWithSetupMatch[1];
    const fullAlg = `${setupMoves} ${mainAlg} ${Cube.inverse(setupMoves)}`;
    return fullAlg;
  }

  __pureCommutatorAsSequenceOfMoves(commutator) {
    return `${commutator[0]} ${commutator[1]} ${Cube.inverse(
      commutator[0]
    )} ${Cube.inverse(commutator[1])}`;
  }
}
