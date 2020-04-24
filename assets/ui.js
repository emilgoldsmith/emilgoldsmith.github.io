class ThreeStyleInformation {
  constructor(containerId) {
    this.containerNode = document.getElementById(containerId);
    this.containerNode.innerHTML = `
          <h3>3-Style Corner Random Practice Order</h3>
          <h4>Currently learned pairs</h4>
          <div class="displaybox">
            Fetching data...
          </div>
        `;
  }

  displayThreeStyleData(threeStyleData) {
    const knownPairsHtml = threeStyleData.pairs
      .map((x) => x.pair)
      .sort()
      .reduce(
        (prev, cur) =>
          `${prev} <span id="${cur}">${cur}<button onclick="toggleSkipPair('${cur}')">Toggle Skip</button></span>`,
        ""
      );
    this.containerNode.querySelector(".displaybox").innerHTML = knownPairsHtml;
    this.containerNode.querySelector("h4").innerText +=
      " (" + threeStyleData.numPairs().toString() + ")";
  }
}

class ThreeStylePracticeForm {
  constructor(containerId) {
    this.containerNode = document.getElementById(containerId);
    this.numPairsToTestInputId = `${containerId}-numPairsToTestInput`;
    this.containerNode.innerHTML = `
          <span>Number of pairs to test:</span>
          <input disabled id="${this.numPairsToTestInputId}" type="number" value="0" />
          <button disabled onclick="runTest()">Run Partial Test</button>
          <button disabled onclick="runFullTest()">Test All</button>
          <span>Pause between pairs</span>
          <input disabled type="checkbox" checked />
        `;
  }

  onThreeStyleDataLoaded(threeStyleData) {
    this.__restrictNumPairsToTestSelectorRange({
      min: 1,
      max: threeStyleData.numPairs(),
    });
    this.enableAllElements();
  }

  __restrictNumPairsToTestSelectorRange({ min, max }) {
    const numPairsToTestInput = document.getElementById(
      this.numPairsToTestInputId
    );
    numPairsToTestInput.min = min;
    numPairsToTestInput.max = max;
    // We set the initial value to the max value or 10 if the max value is higher than 10
    numPairsToTestInput.value = Math.min(10, max);
  }

  enableAllElements() {
    this.containerNode
      .querySelectorAll(":disabled")
      .forEach((x) => (x.disabled = false));
  }

  disableAllElements() {
    document.activeElement.blur();
    this.containerNode
      .querySelectorAll("button,input")
      .forEach((x) => (x.disabled = true));
  }

  shouldPauseBetweenTests() {
    return this.containerNode.querySelector('input[type="checkbox"]').checked;
  }

  numPairsToTest() {
    return Number(document.getElementById(this.numPairsToTestInputId).value);
  }

  setNumPairsToTest(numPairsToTest) {
    document.getElementById(this.numPairsToTestInputId).value = numPairsToTest;
  }
}

class TimerUI {
  constructor(timerNode) {
    this.timerNode = timerNode;
  }

  displayTimer(timer) {
    this.timer = timer;
    // Set interval only runs after the elapsed time so we also run initially
    this.updateUI();
    this.timeoutId = setInterval(this.updateUI.bind(this), 50);
  }

  updateUI() {
    this.timerNode.innerText = this.timer.secondsElapsed().toFixed(3);
  }

  untrackTimer() {
    clearTimeout(this.timeoutId);
    this.timer = null;
  }
}

class ThreeStylePracticeTest {
  constructor(containerId) {
    this.containerNode = document.getElementById(containerId);
    this.containerNode.style.display = "none";
    this.instructionNodeId = `${containerId}-test-instructions`;
    this.currentPairNodeId = `${containerId}-current-pair`;
    this.timerNodeId = `${containerId}-timer`;
    this.resultsContainerId = `${containerId}-results-container`;
    this.sessionResultsNodeId = `${containerId}-session-results`;
    this.correctAlgNodeId = `${containerId}-correct-alg`;
    this.verificationAlgorithmNodeId = `${containerId}-verification-algorithm`;
    this.resultsSummaryNodeId = `${containerId}-results-summary`;
    this.containerNode.innerHTML = `
          <h3 id="${this.timerNodeId}">The Time For Current Pair Will Be Shown Here</h3>
          <h3 id="${this.currentPairNodeId}">The Pair being Tested Will Show Here</h3>
          <h3 id="${this.correctAlgNodeId}"></h3>
          <p id="${this.instructionNodeId}"></p>
          <div id="${this.resultsContainerId}" style="display: none;">
            <h4>Results:</h4>
            <div id="${this.sessionResultsNodeId}" class="displaybox"></div>
            <h4 id="${this.verificationAlgorithmNodeId}">
              The algorithm to verify your algorithms will be shown here
            </h4>
            <div class="verificationcube" style="display: none;"><img /><img /></div>
            <h5 id="${this.resultsSummaryNodeId}"></h5>
          </div>
        `;
    this.displayPausedInstructions();
    this.timerUI = new TimerUI(document.getElementById(this.timerNodeId));
  }

  show() {
    this.containerNode.style.display = "block";
  }

  __setInstructions(instructions) {
    document.getElementById(this.instructionNodeId).innerText = instructions;
  }

  displayPausedInstructions() {
    this.__setInstructions("Press Space To Start Next Pair");
  }

  displayVerdictInstructions() {
    this.__setInstructions(
      "Press C for correct, W for wrong and S for showing the correct algorithm (do this before judging the attempt)"
    );
  }

  displayTestRunningInstructions() {
    this.__setInstructions("Press Space When Finished");
  }

  displayFinishedInstructions() {
    this.__setInstructions("The Test Is Over");
  }

  trackTimer(timer) {
    this.timerUI.displayTimer(timer);
  }

  untrackTimer() {
    this.timerUI.untrackTimer();
  }

  setCurrentlyTestedPair(pair) {
    document.getElementById(this.currentPairNodeId).innerText = pair;
  }

  resetSessionResults() {
    document.getElementById(this.resultsContainerId);
  }

  displayResult(result, testNumber) {
    const sessionResultsNode = document.getElementById(
      this.sessionResultsNodeId
    );
    const currentResultsString = sessionResultsNode.innerText;
    const newlineSeparatorIfNecessary = currentResultsString ? "\n" : "";
    const testNumberIndicator = testNumber.toString() + ".";
    const twoDecimalResultInSeconds = (result.time / 1000).toFixed(3);

    sessionResultsNode.innerText = `${currentResultsString}${newlineSeparatorIfNecessary}\
  ${testNumberIndicator} ${result.pair}: ${twoDecimalResultInSeconds} - ${result.verdict}. Algorithm: ${result.alg}`;

    if (!currentResultsString) {
      document.getElementById(this.resultsContainerId).style.display = "block";
    }
  }

  showAlg(alg) {
    document.getElementById(this.correctAlgNodeId).innerText = alg;
  }

  hideAlg() {
    document.getElementById(this.correctAlgNodeId).innerText = "";
  }

  displayVerificationAlgorithm(algorithm) {
    document.getElementById(
      this.verificationAlgorithmNodeId
    ).innerText = `Verification Algorithm: ${algorithm}`;
  }

  setResultsSummary(summary) {
    document.getElementById(this.resultsSummaryNodeId).innerText = summary;
  }
}
