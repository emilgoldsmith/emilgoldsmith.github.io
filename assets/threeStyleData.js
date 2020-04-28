const IS_DEV = window.location.hostname === "localhost";
const DOMAIN = IS_DEV
  ? "http://localhost:4000"
  : "https://emils-api.herokuapp.com";

const DONT_STORE = "NO_PASSWORD";
class PasswordHandler {
  constructor() {
    const password = localStorage.getItem("password");
    if (password === null) {
      const passwordToStore = this.__promptForPassword();
      this.__validateAndStorePassword(passwordToStore);
    } else {
      this.password = password;
    }
  }

  getPassword() {
    return this.password === DONT_STORE ? null : this.password;
  }

  __promptForPassword() {
    const passwordInput = window.prompt(
      "If you want to be able to store results you need to input the password here. Leave this empty if you don't want to store results"
    );
    const passwordToStore = passwordInput === "" ? DONT_STORE : passwordInput;
    return passwordToStore;
  }

  async __validateAndStorePassword(passwordToStore) {
    if (passwordToStore === DONT_STORE) {
      this.__storePassword(passwordToStore);
    } else {
      const valid = await this.__validatePassword(passwordToStore);
      if (valid) {
        this.__storePassword(passwordToStore);
      } else {
        const newPasswordAttempt = this.__promptForPassword();
        this.__validateAndStorePassword(newPasswordAttempt);
      }
    }
  }

  async __validatePassword(password) {
    const body = JSON.stringify({
      password,
    });
    const response = await fetch(`${DOMAIN}/validate-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    return response.status === 200;
  }

  __storePassword(password) {
    localStorage.setItem("password", password);
    this.password = password;
  }
}

const passwordHandler = new PasswordHandler();
class ThreeStyleData {
  constructor(commutatorProcessor) {
    this.pairs = null;
    this.commutatorProcessor = commutatorProcessor;
  }

  async fetchData() {
    const response = await fetch(`${DOMAIN}/threestyledata`);
    this.pairs = await response.json();
    this.__validateCommutators();
  }

  async logResult(result) {
    const password = passwordHandler.getPassword();
    if (password === null) return;
    const body = JSON.stringify({
      password,
      data: result,
    });
    await fetch(`${DOMAIN}/log-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  }

  __validateCommutators() {
    const invalidAlgorithms = this.pairs.filter(
      (x) => !this.commutatorProcessor.validateCommutator(x.alg)
    );
    if (invalidAlgorithms.length > 0) {
      window.alert(
        "You have invalid algorithms: " +
          invalidAlgorithms.map((x) => `${x.pair}: ${x.alg}`).join(", ")
      );
    }
  }

  numPairs() {
    return this.pairs.length;
  }

  toggleSkipPair(pair) {
    const dataPoint = this.pairs.find((x) => x.pair === pair);
    dataPoint.skipped = !dataPoint.skipped;
    document.getElementById(pair).style.backgroundColor = dataPoint.skipped
      ? "grey"
      : "inherit";
  }

  randomizeDataOrder() {
    this.__shuffleArray(this.pairs);
    this.__randomizeCycleDirections();
  }

  /**
   * Taken from https://stackoverflow.com/a/12646864
   */
  __shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  __randomizeCycleDirections() {
    this.pairs.forEach((x) => {
      const shouldReverse = Math.floor(Math.random() * 2) == 0;
      if (shouldReverse) {
        x.pair = x.pair.split("").reverse().join("");
        x.alg = this.commutatorProcessor.inverseCommutator(x.alg);
        if (!this.commutatorProcessor.validateCommutator(x.alg))
          throw new Error("Error in inversing");
      }
    });
  }
}

class ThreeStyleStatistics {
  constructor(threeStyleData) {
    this.threeStyleData = threeStyleData;
    this.fullStats = null;
    this.processedStats = null;
  }

  async fetchData() {
    this.allPairs = this.threeStyleData.pairs
      .map((x) => x.pair)
      .concat(threeStyleData.pairs.map((x) => x.pair[1] + x.pair[0]));
    const response = await fetch(`${DOMAIN}/statistics`);
    this.fullStats = await response.json();
    this.processedStats = this.__processStats();
  }

  __processStats() {
    const unsortedProcessed = this.fullStats
      .map((pairInfo) => ({
        pair: pairInfo.pair,
        lastThreeMean: this.__getLast3Mean(pairInfo),
        lastThreeNumDNF: this.__getLast3NumDNF(pairInfo),
      }))
      .concat(this.__getMissingPairs());
    const sortedProcessed = this.__sortByMostPracticeNeeded(unsortedProcessed);
    return sortedProcessed;
  }

  __getMissingPairs() {
    return this.allPairs
      .filter((x) => this.fullStats.find((y) => x === y.pair) === undefined)
      .map((pair) => ({ pair, lastThreeMean: NaN, lastThreeNumDNF: 3 }));
  }

  __getLast3Mean(pairInfo) {
    const last3 = this.__getLast3(pairInfo);
    return last3.reduce((sum, next) => sum + next.time, 0) / 3;
  }

  __getLast3NumDNF(pairInfo) {
    const last3 = this.__getLast3(pairInfo);
    const numNotAttempted = 3 - last3.length;
    return numNotAttempted + last3.filter((x) => !x.correct).length;
  }

  __getLast3(pairInfo) {
    return pairInfo.results.slice(-3);
  }

  __sortByMostPracticeNeeded(unsortedProcessed) {
    const copyForImmutability = [...unsortedProcessed];
    const sortedProcessed = copyForImmutability.sort((a, b) => {
      const dnfDiff = b.lastThreeNumDNF - a.lastThreeNumDNF;
      if (dnfDiff !== 0) return dnfDiff;
      if (isNaN(a.lastThreeMean) && isNaN(b.lastThreeMean)) return 0;
      if (isNaN(b.lastThreeMean)) return 1;
      if (isNaN(a.lastThreeMean)) return -1;
      return b.lastThreeMean - a.lastThreeMean;
    });
    return sortedProcessed;
  }
}
