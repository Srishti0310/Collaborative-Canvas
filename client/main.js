import { connectSocket } from "./websocket.js";
import { createCanvasEngine } from "./canvas.js";

console.log("✅ main.js loaded");

// ---------------------------
// DOM Elements
// ---------------------------
const canvas = document.getElementById("board");
const statusFPS = document.getElementById("statusFPS");

const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");

const colorPicker = document.getElementById("colorPicker");
const widthSlider = document.getElementById("widthSlider");
const widthValue = document.getElementById("widthValue");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// users list (NOTE: only if you still have usersList in HTML)
const usersList = document.getElementById("usersList");

// Online count in navbar
const onlineCount = document.getElementById("onlineCount");

// palette dom
const colorPalette = document.getElementById("colorPalette");
const selectedColorPreview = document.getElementById("selectedColorPreview");

// status bar dom
const statusLeft = document.getElementById("statusLeft");
const statusCenter = document.getElementById("statusCenter");
const statusRight = document.getElementById("statusRight");

// toast dom
const appToastEl = document.getElementById("appToast");
const toastBodyEl = document.getElementById("toastBody");

// brush cursor
const brushCursor = document.getElementById("brushCursor");

// ---------------------------
// Helpers
// ---------------------------
function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || "global";
}
const roomId = getRoomId();

// toast helper
function showToast(message) {
  if (!appToastEl || !toastBodyEl) return;
  toastBodyEl.textContent = message;
  const toast = new bootstrap.Toast(appToastEl, { delay: 2200 });
  toast.show();
}

function setActiveTool(button) {
  brushBtn.classList.remove("activeTool");
  eraserBtn.classList.remove("activeTool");
  button.classList.add("activeTool");
}

function updateStatus() {
  if (!statusCenter) return;

  const toolName = brushBtn.classList.contains("activeTool")
    ? "Brush"
    : "Eraser";
  const width = widthValue?.textContent || "6";
  const color = colorPicker?.value || "#111111";

  statusCenter.textContent = `Tool: ${toolName} | Width: ${width} | Color: ${color}`;
}

// ---------------------------
// Canvas + Socket
// ---------------------------
const engine = createCanvasEngine(canvas);
const { socket, emitJoin } = connectSocket();

let joined = false;

// allow draw only after join
engine.setCanDraw(() => joined);

// ---------------------------
// Palette Colors (no scroll)
// ---------------------------
const PALETTE_COLORS = [
  "#000000", // black
  "#ffffff", // white
  "#6b7280", // gray
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#fde047", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#2563eb", // deep blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#a16207", // brown
];

// ---------------------------
// Brush cursor preview logic
// ---------------------------
function updateBrushCursorStyle() {
  if (!brushCursor) return;

  const width = Number(widthSlider?.value || 6);

  brushCursor.style.width = `${width}px`;
  brushCursor.style.height = `${width}px`;

  if (eraserBtn.classList.contains("activeTool")) {
    brushCursor.style.border = "2px dashed #111";
  } else {
    brushCursor.style.border = `2px solid ${colorPicker.value}`;
  }
}

// follow mouse
window.addEventListener("pointermove", (e) => {
  if (!brushCursor) return;
  brushCursor.style.left = `${e.clientX}px`;
  brushCursor.style.top = `${e.clientY}px`;
});

// show/hide cursor when entering canvas
canvas.addEventListener("pointerenter", () => {
  if (!brushCursor) return;
  brushCursor.style.display = "block";
  canvas.style.cursor = "none";
});

canvas.addEventListener("pointerleave", () => {
  if (!brushCursor) return;
  brushCursor.style.display = "none";
  canvas.style.cursor = "default";
});

canvas.addEventListener("pointerdown", () => {
  if (!brushCursor) return;
  brushCursor.style.transform = "translate(-50%, -50%) scale(0.85)";
});

canvas.addEventListener("pointerup", () => {
  if (!brushCursor) return;
  brushCursor.style.transform = "translate(-50%, -50%) scale(1)";
});

canvas.addEventListener("pointercancel", () => {
  if (!brushCursor) return;
  brushCursor.style.transform = "translate(-50%, -50%) scale(1)";
});

// ---------------------------
// Palette logic
// ---------------------------
let selectedColor = colorPicker?.value || "#111111";

function updateSelectedColorUI(color) {
  selectedColor = color;

  if (selectedColorPreview) selectedColorPreview.style.background = color;
  if (colorPicker) colorPicker.value = color;

  engine.setColor(color);

  // highlight active swatch
  document.querySelectorAll(".palette-color").forEach((el) => {
    el.classList.toggle("active", el.dataset.color === color);
  });

  updateBrushCursorStyle();
  updateStatus();
}

function renderPalette() {
  if (!colorPalette) return;

  colorPalette.innerHTML = "";

  for (const c of PALETTE_COLORS) {
    const swatch = document.createElement("div");
    swatch.className = "palette-color";
    swatch.dataset.color = c;
    swatch.style.background = c;

    if (c.toLowerCase() === "#ffffff") {
      swatch.style.border = "1px solid rgba(0,0,0,0.35)";
    }

    swatch.title = c;
    swatch.addEventListener("click", () => updateSelectedColorUI(c));

    colorPalette.appendChild(swatch);
  }

  updateSelectedColorUI(selectedColor);
}

// render palette on load
renderPalette();
updateBrushCursorStyle();
updateStatus();

// ---------------------------
// UI events
// ---------------------------
joinBtn.addEventListener("click", () => {
  if (joined) return;

  const name = nameInput.value.trim() || "Anonymous";

  // ✅ join room
  emitJoin(name, roomId);

  joined = true;
  joinBtn.disabled = true;
  nameInput.disabled = true;
});

brushBtn.addEventListener("click", () => {
  engine.setTool("brush");
  setActiveTool(brushBtn);
  updateBrushCursorStyle();
  updateStatus();
});

eraserBtn.addEventListener("click", () => {
  engine.setTool("eraser");
  setActiveTool(eraserBtn);
  updateBrushCursorStyle();
  updateStatus();
});

colorPicker.addEventListener("input", (e) => {
  updateSelectedColorUI(e.target.value);
});

widthSlider.addEventListener("input", (e) => {
  const v = Number(e.target.value);
  widthValue.textContent = v;
  engine.setWidth(v);
  updateBrushCursorStyle();
  updateStatus();
});

undoBtn.addEventListener("click", () => socket.emit("history:undo"));
redoBtn.addEventListener("click", () => socket.emit("history:redo"));

// keyboard shortcuts
window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

  if (!ctrlOrCmd) return;

  if (e.key.toLowerCase() === "z") {
    e.preventDefault();
    socket.emit("history:undo");
  }

  if (e.key.toLowerCase() === "y") {
    e.preventDefault();
    socket.emit("history:redo");
  }
});

// ---------------------------
// Canvas pointer events -> socket
// ---------------------------
engine.bindPointerHandlers({
  onStrokeStart: (payload) => {
    if (!joined) return showToast("⚠️ Please click Join first");
    socket.emit("stroke:start", payload);
  },
  onStrokeMove: (payload) => {
    if (!joined) return;
    socket.emit("stroke:move", payload);
  },
  onStrokeEnd: (payload) => {
    if (!joined) return;
    socket.emit("stroke:end", payload);
  },
  onCursorMove: (payload) => {
    if (!joined) return;
    socket.emit("cursor:move", payload);
  },
});

// ---------------------------
// Socket listeners
// ---------------------------
socket.on("connect", () => {
  if (statusLeft) statusLeft.textContent = "🟢 Connected";
});

socket.on("disconnect", () => {
  if (statusLeft) statusLeft.textContent = "🔴 Disconnected";
});

socket.on("toast:event", ({ type, user }) => {
  if (type === "join") showToast(`✅ ${user} joined`);
  if (type === "leave") showToast(`👋 ${user} left`);
  if (type === "undo") showToast(`↩️ Undo by ${user}`);
  if (type === "redo") showToast(`↪️ Redo by ${user}`);
});

socket.on("init", ({ me, users, strokes }) => {
  engine.setUser(me);
  renderUsers(users);
  engine.replayStrokes(strokes);
});

socket.on("users:list", ({ users }) => {
  renderUsers(users);
});

socket.on("stroke:start", (payload) => engine.onRemoteStrokeStart(payload));
socket.on("stroke:move", (payload) => engine.onRemoteStrokeMove(payload));
socket.on("stroke:end", (payload) => engine.onRemoteStrokeEnd(payload));

socket.on("canvas:state", ({ strokes }) => {
  engine.replayStrokes(strokes);
});

// ---------------------------
// Users UI
// ---------------------------
function renderUsers(users) {
  // update navbar count
  if (onlineCount) onlineCount.textContent = users.length;

  // update bottom status
  if (statusRight) statusRight.textContent = `Users: ${users.length}`;

  // if users list exists
  if (!usersList) return;

  usersList.innerHTML = "";

  for (const u of users) {
    const li = document.createElement("li");
    li.className = "list-group-item";

    li.innerHTML = `
      <div class="userItem">
        <span class="dot" style="background:${u.color}"></span>
        <span class="fw-semibold">${u.name}</span>
      </div>
    `;

    usersList.appendChild(li);
  }
}

// ---------------------------
// FPS loop
// ---------------------------
let lastFrameTime = performance.now();
let frameCount = 0;

function fpsLoop() {
  frameCount++;
  const now = performance.now();

  if (now - lastFrameTime >= 1000) {
    if (statusFPS) statusFPS.textContent = `FPS: ${frameCount}`;
    frameCount = 0;
    lastFrameTime = now;
  }

  requestAnimationFrame(fpsLoop);
}

fpsLoop();
