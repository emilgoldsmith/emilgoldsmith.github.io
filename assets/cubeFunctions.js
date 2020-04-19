/**
 * If no alg is given then it gives a random scramble
 * @param {string} alg - Algorithm to state to be scrambled too
 */
function getScramble(alg) {
  return new Promise((resolve) => {
    if (alg) new Cube().move(alg).asyncSolve(resolve);
    else Cube.asyncScramble(resolve);
  });
}

function getSolution(scramble) {
  return new Promise((resolve) => {
    new Cube().move(scramble).asyncSolve(resolve);
  });
}

function displayScramble(alg) {
  document.getElementById("scrambleContainer").style.display = "block";
  document.getElementById("scrambleText").innerText = alg;
  const baseUrl = getDisplayCubeUrl(alg);
  const imageTags = document.querySelectorAll("#scrambleContainer img");
  imageTags[0].src = baseUrl;
  imageTags[1].src = `${baseUrl}x2y'`;
}

function displayVerificationCube(alg) {
  document.querySelector(".verificationcube").style.display = "block";
  const baseUrl = getDisplayCubeUrl(alg);
  const imageTags = document.querySelectorAll(".verificationcube img");
  imageTags[0].src = baseUrl;
  imageTags[1].src = `${baseUrl}x2y'`;
}

executeCubeFn(() => getScramble().then(displayScramble));

function getDisplayCubeUrl(alg) {
  const urlFriendlyAlg = alg.replace(/\s+/g, ""); // remove spaces
  const baseUrl =
    "http://cube.crider.co.uk/visualcube.png?bg=t&sch=wrgyob&size=150&alg=" +
    urlFriendlyAlg;
  return baseUrl;
}
