import Matter from "matter-js";
import "./styles.css";

const { Body, Bodies, Engine, Events, Runner, Vector } = Matter;

const canvas = document.querySelector("#play-canvas");
const ctx = canvas.getContext("2d");
const resetButton = document.querySelector("#reset-button");
const motionButton = document.querySelector("#motion-button");
const stage = document.querySelector(".hero__stage");

const world = {
  width: 1240,
  height: 421,
  corridor: 68,
  ballRadius: 26,
};

const svgSpace = {
  width: 442,
  height: 150,
};

const wordmarkPath = new Path2D(
  "M62.085 1C73.1058 1 82.675 3.15675 90.7559 7.51172H90.7549C98.868 11.811 105.139 17.8364 109.544 25.5801L109.951 26.3057C111.139 28.4709 112.155 30.7322 113 33.0879V1H150.156V117.903H207.595L246.809 1.68066L247.038 1H342.704L342.957 1.62305L367.452 61.8555L397.923 1.54883L398.2 1H439.781L438.968 2.48145L385.895 99.1318V148.454H348.951V99.1631L304.834 29.3252L344.584 147.135L345.029 148.454H305.118L304.898 147.754L295.53 117.915H246.766L237.417 147.754L237.197 148.454H113V71.5C112.027 74.195 110.826 76.7642 109.397 79.207C104.94 86.8626 98.5676 92.7941 90.3086 96.9961C82.0434 101.201 72.2691 103.284 61.0195 103.284H38.1562V148.454H1V1H62.085ZM255.76 89.21H286.518L271.122 40.1758L255.76 89.21ZM38.1562 73.585H54.4854C59.6779 73.585 63.9357 72.6801 67.3057 70.9277L67.3105 70.9258C70.7455 69.1631 73.3175 66.7171 75.0615 63.5869C76.8128 60.3962 77.7041 56.6624 77.7041 52.3555C77.7041 47.9956 76.8108 44.2889 75.0645 41.1992L75.0615 41.1943C73.319 38.0667 70.7501 35.6467 67.3203 33.9316C63.8965 32.2198 59.6316 31.3379 54.4854 31.3379H38.1562V73.585Z",
);

const path = scaleSvgPoints([
  [21, 121],
  [21, 28],
  [64, 28],
  [92, 34],
  [106, 54],
  [101, 72],
  [86, 89],
  [57, 99],
  [38, 99],
  [82, 92],
  [107, 76],
  [122, 32],
  [132, 32],
  [132, 121],
  [221, 121],
  [251, 28],
  [309, 28],
  [336, 121],
  [371, 72],
  [422, 14],
  [367, 99],
  [367, 121],
]);

const start = point(path[0]);
const finish = point(path[path.length - 1]);
const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0.0022 } });
const runner = Runner.create();
const ball = Bodies.circle(start.x, start.y, world.ballRadius, {
  frictionAir: 0.032,
  restitution: 0.12,
  density: 0.004,
});

Matter.Composite.add(engine.world, ball);

const state = {
  dpr: 1,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  pointerTilt: { x: 0, y: 0 },
  keyTilt: { x: 0, y: 0 },
  gyroTilt: { x: 0, y: 0 },
  gyroActive: false,
  complete: false,
  started: false,
  message: "Start",
  messageUntil: 0,
};

resize();
resetBall();
Runner.run(runner, engine);
requestAnimationFrame(draw);

window.addEventListener("resize", resize);
resetButton.addEventListener("click", resetBall);
motionButton.addEventListener("click", startGame);

stage.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  state.started = true;
  stage.setPointerCapture(event.pointerId);
  setPointerTilt(event);
});

stage.addEventListener("pointermove", (event) => {
  if (state.dragging) setPointerTilt(event);
});

stage.addEventListener("pointerup", (event) => {
  state.dragging = false;
  state.pointerTilt = { x: 0, y: 0 };
  stage.releasePointerCapture(event.pointerId);
});

stage.addEventListener("pointercancel", () => {
  state.dragging = false;
  state.pointerTilt = { x: 0, y: 0 };
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
    event.preventDefault();
    state.started = true;
    if (key === "arrowleft" || key === "a") state.keyTilt.x = -1;
    if (key === "arrowright" || key === "d") state.keyTilt.x = 1;
    if (key === "arrowup" || key === "w") state.keyTilt.y = -1;
    if (key === "arrowdown" || key === "s") state.keyTilt.y = 1;
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "a", "d"].includes(key)) state.keyTilt.x = 0;
  if (["arrowup", "arrowdown", "w", "s"].includes(key)) state.keyTilt.y = 0;
});

window.addEventListener("deviceorientation", (event) => {
  if (!state.gyroActive) return;
  const beta = clamp(event.beta ?? 0, -28, 28) / 28;
  const gamma = clamp(event.gamma ?? 0, -28, 28) / 28;
  state.gyroTilt = { x: gamma, y: beta };
});

Events.on(engine, "beforeUpdate", () => {
  const tilt = mergedTilt();
  engine.gravity.x = tilt.x * 0.82;
  engine.gravity.y = tilt.y * 0.82;

  if (!state.started || state.complete) {
    engine.gravity.x = 0;
    engine.gravity.y = 0;
  }
});

Events.on(engine, "afterUpdate", () => {
  keepBallOnTrack();
  updateGoalState();
});

async function startGame() {
  state.started = true;

  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      state.gyroActive = permission === "granted";
      motionButton.textContent = state.gyroActive ? "Live" : "Start";
    } catch {
      state.gyroActive = false;
    }
  } else if ("DeviceOrientationEvent" in window) {
    state.gyroActive = true;
    motionButton.textContent = "Live";
  }

  flash("Go");
}

function resize() {
  const rect = stage.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * state.dpr);
  canvas.height = Math.round(rect.height * state.dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  state.scale = Math.min(rect.width / world.width, rect.height / world.height);
  state.offsetX = (rect.width - world.width * state.scale) / 2;
  state.offsetY = (rect.height - world.height * state.scale) / 2;
}

function draw() {
  const now = performance.now();
  const width = canvas.width / state.dpr;
  const height = canvas.height / state.dpr;

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);

  ctx.save();
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(state.scale, state.scale);
  drawTrack();
  drawBall();
  drawOverlay(now);
  ctx.restore();

  requestAnimationFrame(draw);
}

function drawBackground(width, height) {
  ctx.fillStyle = "#f7f7f6";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(15, 23, 42, 0.045)";
  ctx.lineWidth = 1;
  for (let y = 54; y < height; y += 82) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawTrack() {
  drawWordmark();
  drawDirectionalDashes();
  drawFinish();
}

function drawWordmark() {
  ctx.save();
  ctx.scale(world.width / svgSpace.width, world.height / svgSpace.height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 2;
  ctx.stroke(wordmarkPath);
  ctx.restore();
}

function drawDirectionalDashes() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([17, 26]);
  ctx.lineDashOffset = -performance.now() * 0.006;
  ctx.strokeStyle = "rgba(17, 24, 39, 0.13)";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  path.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawLetter(letterPath) {
  ctx.lineJoin = "miter";
  ctx.miterLimit = 2.5;
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 6;
  ctx.fillStyle = "#f7f7f6";
  ctx.fill(letterPath, "evenodd");
  ctx.stroke(letterPath);
}

function createPPath() {
  const letter = new Path2D();
  letter.moveTo(40, 60);
  letter.lineTo(222, 60);
  letter.bezierCurveTo(324, 60, 374, 118, 374, 198);
  letter.bezierCurveTo(374, 280, 316, 320, 220, 320);
  letter.lineTo(145, 320);
  letter.lineTo(145, 395);
  letter.lineTo(40, 395);
  letter.closePath();

  letter.moveTo(145, 145);
  letter.lineTo(214, 145);
  letter.bezierCurveTo(270, 145, 306, 174, 306, 218);
  letter.bezierCurveTo(306, 264, 270, 280, 214, 280);
  letter.lineTo(145, 280);
  letter.closePath();
  return letter;
}

function createLPath() {
  const letter = new Path2D();
  letter.moveTo(374, 60);
  letter.lineTo(470, 60);
  letter.lineTo(470, 316);
  letter.lineTo(640, 316);
  letter.lineTo(640, 395);
  letter.lineTo(374, 395);
  letter.closePath();
  return letter;
}

function createAPath() {
  const letter = new Path2D();
  letter.moveTo(640, 395);
  letter.lineTo(748, 60);
  letter.lineTo(974, 60);
  letter.lineTo(1094, 395);
  letter.lineTo(988, 395);
  letter.lineTo(958, 316);
  letter.lineTo(784, 316);
  letter.lineTo(760, 395);
  letter.closePath();

  letter.moveTo(850, 166);
  letter.lineTo(800, 258);
  letter.lineTo(900, 258);
  letter.closePath();
  return letter;
}

function createYPath() {
  const letter = new Path2D();
  letter.moveTo(990, 60);
  letter.lineTo(1084, 60);
  letter.lineTo(1136, 202);
  letter.lineTo(1194, 60);
  letter.lineTo(1230, 60);
  letter.lineTo(1086, 268);
  letter.lineTo(1086, 395);
  letter.lineTo(990, 395);
  letter.lineTo(990, 268);
  letter.closePath();
  return letter;
}

function drawFinish() {
  ctx.beginPath();
  ctx.arc(finish.x, finish.y, 45, 0, Math.PI * 2);
  ctx.fillStyle = "#050505";
  ctx.fill();
}

function drawBall() {
  const pos = ball.position;
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, world.ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#3817e8";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.arc(pos.x - 14, pos.y - 14, 7, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
  ctx.fill();
  ctx.restore();
}

function drawOverlay(now) {
  if (state.complete) {
    ctx.fillStyle = "rgba(247, 247, 246, 0.72)";
    ctx.fillRect(0, 0, world.width, world.height);
    drawMessage("Nice");
    return;
  }

  if (now < state.messageUntil) drawMessage(state.message);
}

function drawMessage(text) {
  ctx.font = "700 82px Inter, ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#111827";
  ctx.fillText(text, world.width / 2, world.height / 2);
}

function setPointerTilt(event) {
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
  const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
  state.pointerTilt = {
    x: clamp(x * 1.25, -1, 1),
    y: clamp(y * 1.25, -1, 1),
  };
}

function mergedTilt() {
  const tilt = {
    x: state.pointerTilt.x + state.keyTilt.x + state.gyroTilt.x,
    y: state.pointerTilt.y + state.keyTilt.y + state.gyroTilt.y,
  };
  return {
    x: clamp(tilt.x, -1, 1),
    y: clamp(tilt.y, -1, 1),
  };
}

function keepBallOnTrack() {
  const nearest = nearestOnPath(ball.position);
  const limit = world.corridor / 2 - world.ballRadius * 0.25;
  if (nearest.distance <= limit) return;

  const normal = Vector.normalise(Vector.sub(ball.position, nearest.point));
  const safePoint = Vector.add(nearest.point, Vector.mult(normal, limit));
  const velocityIntoWall = Vector.dot(ball.velocity, normal);
  const rebound = velocityIntoWall > 0 ? Vector.mult(normal, velocityIntoWall * 1.35) : { x: 0, y: 0 };

  Body.setPosition(ball, safePoint);
  Body.setVelocity(ball, Vector.sub(ball.velocity, rebound));
}

function updateGoalState() {
  if (state.complete) return;
  const distance = Vector.magnitude(Vector.sub(ball.position, finish));
  if (distance < 38) {
    state.complete = true;
    motionButton.textContent = "Won";
    Body.setVelocity(ball, { x: 0, y: 0 });
  }
}

function resetBall() {
  state.complete = false;
  state.started = false;
  state.pointerTilt = { x: 0, y: 0 };
  state.keyTilt = { x: 0, y: 0 };
  Body.setPosition(ball, start);
  Body.setVelocity(ball, { x: 0, y: 0 });
  Body.setAngularVelocity(ball, 0);
  motionButton.textContent = "Start";
}

function flash(message) {
  state.message = message;
  state.messageUntil = performance.now() + 900;
}

function nearestOnPath(position) {
  let best = { distance: Infinity, point: point(path[0]) };

  for (let index = 0; index < path.length - 1; index += 1) {
    const a = point(path[index]);
    const b = point(path[index + 1]);
    const ab = Vector.sub(b, a);
    const ap = Vector.sub(position, a);
    const lengthSq = Vector.dot(ab, ab);
    const t = lengthSq === 0 ? 0 : clamp(Vector.dot(ap, ab) / lengthSq, 0, 1);
    const candidate = Vector.add(a, Vector.mult(ab, t));
    const distance = Vector.magnitude(Vector.sub(position, candidate));

    if (distance < best.distance) best = { distance, point: candidate };
  }

  return best;
}

function point([x, y]) {
  return { x, y };
}

function scaleSvgPoints(points) {
  return points.map(([x, y]) => [
    (x / svgSpace.width) * world.width,
    (y / svgSpace.height) * world.height,
  ]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
