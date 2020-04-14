// Make the block constant size
const node = document.getElementById("cubeSolverState");
const padding = document.defaultView.getComputedStyle(node).padding.slice(0, 2);
const paddingSize = Number(padding.slice(0, 2)) || Number(padding.slice(0, 1));
node.style.width = `${node.getBoundingClientRect().width - 2 * paddingSize}px`;

const cubeQueue = [];
let cubeInitialized = false;
function executeCubeFn(f) {
  if (cubeInitialized) return Promise.resolve(f());
  else return new Promise(resolve => cubeQueue.push({ function: f, resolve }));
}

const loadingInterval = setInterval(() => {
  const node = document.getElementById("cubeSolverState");
  const text = node.innerText;
  let newText;
  if (text.slice(text.length - 3) === "...") {
    newText = text.slice(0, text.length - 3);
  } else {
    newText = text + ".";
  }
  node.innerText = newText;
}, 400);

Cube.asyncInit("assets/cubejs/worker.js", function() {
  cubeInitialized = true;
  clearInterval(loadingInterval);
  const node = document.getElementById("cubeSolverState");
  node.style.backgroundColor = "green";
  node.innerText = "Cube Software Initialized";
  setTimeout(() => node.remove(), 3000);
  cubeQueue.forEach(obj => obj.resolve(obj.function()));
});
