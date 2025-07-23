// Config
const N = 2;
const TURNS = 21;
const COLORS = ["#f94144", "#90be6d", "#577590"];
const SHAPES = ["circle", "square", "triangle"];
const SOUNDS = [261.63, 329.63, 392.0]; // C4, E4, G4

// State
let sequence = [];
let turn = 0;
let responses = [];
let pending = [false, false, false, false];
let intervalId = null;

// DOM
const gridEl = document.getElementById("grid");
const turnLabel = document.getElementById("turn-label");
const resultEl = document.getElementById("result");
const btns = [
  document.getElementById("pos-btn"),
  document.getElementById("col-btn"),
  document.getElementById("shape-btn"),
  document.getElementById("sound-btn")
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStimulus() {
  return {
    position: Math.floor(Math.random() * 9),
    color: getRandom(COLORS),
    shape: getRandom(SHAPES),
    sound: Math.floor(Math.random() * 3)
  };
}

// Draw grid and highlight current stimulus
function drawGrid(stimulus) {
  gridEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (stimulus.position === i) {
      cell.appendChild(drawShape(stimulus.color, stimulus.shape));
    }
    gridEl.appendChild(cell);
  }
}

function drawShape(color, shape) {
  const size = 48;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  if (shape === "circle") {
    const circ = document.createElementNS(ns, "circle");
    circ.setAttribute("cx", 24);
    circ.setAttribute("cy", 24);
    circ.setAttribute("r", 20);
    circ.setAttribute("fill", color);
    svg.appendChild(circ);
  } else if (shape === "square") {
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", 8);
    rect.setAttribute("y", 8);
    rect.setAttribute("width", 32);
    rect.setAttribute("height", 32);
    rect.setAttribute("fill", color);
    svg.appendChild(rect);
  } else if (shape === "triangle") {
    const poly = document.createElementNS(ns, "polygon");
    poly.setAttribute("points", "24,8 44,40 4,40");
    poly.setAttribute("fill", color);
    svg.appendChild(poly);
  }
  return svg;
}

// Play tone
function playSound(idx) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = SOUNDS[idx];
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.25);
    o.onended = () => ctx.close();
  } catch (e) {}
}

// Setup button handlers
btns.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    pending[i] = !pending[i];
    btn.classList.toggle("active");
  });
});

function nextTurn() {
  if (turn > 0) {
    // Lock in previous responses
    responses.push([...pending]);
    pending = [false, false, false, false];
    btns.forEach(btn => btn.classList.remove("active"));
  }
  if (turn >= TURNS) {
    clearInterval(intervalId);
    finish();
    return;
  }
  turnLabel.textContent = `Turn: ${turn+1}/${TURNS+1}`;
  let stim = sequence[turn];
  drawGrid(stim);
  playSound(stim.sound);
  turn++;
}

function finish() {
  // Lock in last responses (after turn TURNS)
  responses.push([...pending]);
  // Calculate score
  let score = 0;
  for (let i = N; i < sequence.length; i++) {
    const prev = sequence[i - N];
    const curr = sequence[i];
    const resp = responses[i - 1] || [false, false, false, false];
    const matches = [
      curr.position === prev.position,
      curr.color === prev.color,
      curr.shape === prev.shape,
      curr.sound === prev.sound
    ];
    for (let j = 0; j < 4; j++) {
      if (matches[j] && resp[j]) score++;
      if (!matches[j] && !resp[j]) score++;
    }
  }
  resultEl.innerHTML = `<h2>Your Score</h2><p>${score} / ${(sequence.length-N)*4}</p>`;
}

function startGame() {
  // Initialize
  sequence = [randomStimulus()];
  for (let i = 1; i < TURNS + 1; i++) {
    sequence.push(randomStimulus());
  }
  turn = 0;
  responses = [];
  pending = [false, false, false, false];
  resultEl.innerHTML = "";
  nextTurn();
  intervalId = setInterval(nextTurn, 2000);
}

// Start on load
window.onload = startGame;
