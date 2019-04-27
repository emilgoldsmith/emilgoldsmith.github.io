const node = document.getElementById("smallHack");
const dotWidth = node.getBoundingClientRect().width;
node.remove();

const loadingInterval = setInterval(() => {
  const node = document.getElementById("cubeSolverState");
  const style =
    node.style.paddingRight ||
    document.defaultView.getComputedStyle(node)["padding-right"];
  const rightPadding = Number(style.slice(0, 2)) || Number(style.slice(0, 1));
  const text = node.innerText;
  let newText;
  if (text.slice(text.length - 3) === "...") {
    newText = text.slice(0, text.length - 3);
    node.style.paddingRight = `${rightPadding + 3 * dotWidth}px`;
  } else {
    newText = text + ".";
    node.style.paddingRight = `${rightPadding - dotWidth}px`;
  }
  node.innerText = newText;
}, 400);

Cube.asyncInit("assets/cubejs/worker.js", function() {
  clearInterval(loadingInterval);
  const node = document.getElementById("cubeSolverState");
  node.style.backgroundColor = "green";
  node.innerText = "Cube Software Initialized";
  setTimeout(() => node.remove(), 3000);
});
