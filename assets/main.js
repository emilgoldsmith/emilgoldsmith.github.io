const threeStyleInformation = new ThreeStyleInformation(
  "threeStyleInformation"
);
const threeStylePracticeForm = new ThreeStylePracticeForm(
  "threeStylePracticeForm"
);
const threeStylePracticeTest = new ThreeStylePracticeTest(
  "threeStylePracticeTest"
);
const commutatorProcessor = new CommutatorProcessor();
const threeStyleData = new ThreeStyleData(commutatorProcessor);
const threeStyleStatistics = new ThreeStyleStatistics(threeStyleData);

threeStyleData
  .fetchData()
  .then(() => threeStyleStatistics.fetchData())
  .then(() => {
    threeStyleInformation.displayThreeStyleStats(threeStyleStatistics);
    threeStylePracticeForm.onThreeStyleDataLoaded(threeStyleData);
  });

let curTestIndex = 0;
const timer = new Timer();
let testStart = null;
let results = [];
const states = {
  NOT_RUNNING: 0,
  RUNNING: 1,
  IN_BETWEEN: 2,
  BEFORE_START: 3,
  AWAITING_VERDICT: 4,
  FINISHED: 5,
};
let testState = states.NOT_RUNNING;
let pauseBetween = null;
let numPairsToTest = null;

function runTest() {
  pauseBetween = threeStylePracticeForm.shouldPauseBetweenTests();
  numPairsToTest = threeStylePracticeForm.numPairsToTest();

  threeStyleData.randomizeDataOrder();
  prepTest();
}

function runFullTest() {
  threeStylePracticeForm.setNumPairsToTest(threeStyleData.pairs.length);
  runTest();
}

window.addEventListener(
  "keyup",
  (e) => {
    if (e.key === " ") {
      if (testState === states.IN_BETWEEN || testState === states.BEFORE_START)
        nextTest();
      else if (testState === states.RUNNING) stopTest();
    }
    if (testState === states.AWAITING_VERDICT) {
      if (e.key === "c") {
        judgeResult(true);
        addResult();
      } else if (e.key === "w") {
        judgeResult(false);
        addResult();
      } else if (e.key === "s") {
        threeStylePracticeTest.showAlg(results[curTestIndex - 1].alg);
      }
    }
  },
  true
);

window.addEventListener("keydown", (e) => {
  if (e.key === " " && e.target === document.body) {
    e.preventDefault();
  }
});

function prepTest() {
  curTestIndex = 0;
  testState = states.BEFORE_START;
  threeStylePracticeTest.displayPausedInstructions();
  results = [];

  threeStylePracticeForm.disableAllElements();
  threeStylePracticeTest.resetSessionResults();
  threeStylePracticeTest.show();
}

function nextTest() {
  testState = states.RUNNING;
  timer.startFromZero();
  threeStylePracticeTest.trackTimer(timer);
  threeStylePracticeTest.setCurrentlyTestedPair(
    threeStyleData.pairs[curTestIndex].pair
  );
  threeStylePracticeTest.displayTestRunningInstructions();
}

function addResult() {
  threeStylePracticeTest.hideAlg();
  const result = results[results.length - 1];
  threeStyleData.logResult(result);
  threeStylePracticeTest.displayResult(result, curTestIndex);
  updateResultsSummary();
  if (curTestIndex === numPairsToTest) completeTest();
  else if (pauseBetween) {
    threeStylePracticeTest.displayPausedInstructions();
    testState = states.IN_BETWEEN;
  } else nextTest();
}

function judgeResult(isCorrect) {
  const verdict = isCorrect ? "Correct" : "Wrong";
  results[results.length - 1].verdict = verdict;
}

function stopTest() {
  testState = states.AWAITING_VERDICT;
  timer.stop();
  threeStylePracticeTest.untrackTimer();
  threeStylePracticeTest.displayVerdictInstructions();
  results.push({
    ...threeStyleData.pairs[curTestIndex],
    time: timer.msElapsed(),
  });
  curTestIndex++;

  const expectedMovesApplied = results
    .map((x) => x.alg)
    .reduce(
      (compositeAlg, nextAlg) =>
        `${compositeAlg} ${commutatorProcessor.asSequenceOfMoves(nextAlg)}`,
      ""
    );
  displayVerificationCube(expectedMovesApplied);
}

function completeTest() {
  testState = states.FINISHED;
  threeStylePracticeForm.enableAllElements();
  const expectedMovesApplied = results
    .map((x) => x.alg)
    .reduce(
      (compositeAlg, nextAlg) =>
        `${compositeAlg} ${commutatorProcessor.asSequenceOfMoves(nextAlg)}`,
      ""
    );
  executeCubeFn(() =>
    getSolution(expectedMovesApplied).then((alg) =>
      threeStylePracticeTest.displayFinishedInstructions(alg)
    )
  );
}

function updateResultsSummary() {
  let resultSummary = buildResultsSummary();
  threeStylePracticeTest.setResultsSummary(resultSummary);
}

function buildResultsSummary() {
  if (results.length <= 0) return "";
  let resultSummary = "";
  const resultsInSeconds = results.map((x) => ({
    ...x,
    time: x.time / 1000,
  }));
  resultSummary = addMeanIncludingDNFs(resultsInSeconds, resultSummary);
  resultSummary = addMeanWithoutDNFs(resultsInSeconds, resultSummary);
  resultSummary = addBestAndWorstTime(resultsInSeconds, resultSummary);
  const getBestAverageString = buildGetBestAverageStringFn(resultsInSeconds);
  if (results.length >= 5) {
    resultSummary += getBestAverageString(5);
  }
  if (results.length >= 12) {
    resultSummary += getBestAverageString(12);
  }
  if (results.length >= 100) {
    resultSummary += getBestAverageString(100);
  }
  return resultSummary;
}

function addMeanWithoutDNFs(resultsInSeconds, resultSummary) {
  const meanOfCorrect = mean(
    resultsInSeconds.filter((x) => x.verdict === "Correct")
  );
  resultSummary += `\nMean (excluding DNF): ${meanOfCorrect.toFixed(3)}`;
  return resultSummary;
}

function addMeanIncludingDNFs(resultsInSeconds, resultSummary) {
  const meanWithoutVerdict = mean(resultsInSeconds);
  resultSummary = `Mean (including DNF): ${meanWithoutVerdict.toFixed(3)}`;
  return resultSummary;
}

function mean(arr) {
  return arr.reduce((sum, cur) => sum + cur.time, 0) / arr.length;
}

function buildGetBestAverageStringFn(resultsInSeconds) {
  return function getBestAverageString(sizeToAvg) {
    const bestAvg = resultsInSeconds.reduce((prev, cur, index) => {
      if (index < sizeToAvg - 1) return prev;
      const avg = getAvg(
        resultsInSeconds.slice(index - sizeToAvg + 1, index + 1)
      );
      if (
        prev === null ||
        (typeof avg === "number" && typeof prev === "string") ||
        (typeof avg === "number" && typeof prev === "number" && avg < prev)
      )
        return avg;
      return prev;
    }, null);
    return `\nBest Average of ${sizeToAvg}: ${
      typeof bestAvg === "number" ? bestAvg.toFixed(3) : bestAvg
    }`;
  };
}

function getAvg(arr) {
  const normalizedArray = arr.sort(compareResults).slice(1, arr.length - 1);
  let result = normalizedArray.map(getDNF).find((x) => x === "DNF");
  if (result === undefined) {
    result = mean(normalizedArray);
  }
  return result;
}

function addBestAndWorstTime(resultsInSeconds, resultSummary) {
  const sortedResultsInSeconds = getSortedResults(resultsInSeconds);
  const high = getDNF(sortedResultsInSeconds[results.length - 1]);
  resultSummary += `\nWorst Time: ${high !== "DNF" ? high.toFixed(3) : high}`;
  const low = getDNF(sortedResultsInSeconds[0]);
  resultSummary += `\nBest Time: ${
    typeof low === "string" ? low : low.toFixed(3)
  }`;
  return resultSummary;
}

function getSortedResults(resultsInSeconds) {
  const sortedResultsInSeconds = [...resultsInSeconds];
  sortedResultsInSeconds.sort(compareResults);
  return sortedResultsInSeconds;
}

function compareResults(a, b) {
  if (a.verdict === "Wrong" && b.verdict === "Wrong") return 0;
  if (a.verdict === "Wrong") return 1;
  if (b.verdict === "Wrong") return -1;
  return a.time - b.time;
}

function getDNF(res) {
  return res.verdict === "Wrong" ? "DNF" : res.time;
}
