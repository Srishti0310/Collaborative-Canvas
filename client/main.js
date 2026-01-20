import { connectSocket } from "./websocket.js";
import { createCanvasEngine } from "./canvas.js";
import { makeDraggable } from "./draggable.js";

console.log("main.js loaded");

// DOM Elements
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

const usersList = document.getElementById("usersList");

//  Palette DOM
const colorPalette = document.getElementById("colorPalette");
const selectedColorPreview = document.getElementById("selectedColorPreview");

// Status bar DOM
const statusLeft = document.getElementById("statusLeft");
const statusCenter = document.getElementById("statusCenter");
const statusRight = document.getElementById("statusRight");

// Toast DOM
const appToastEl = document.getElementById("appToast");
const toastBodyEl = document.getElementById("toastBody");

// Brush cursor preview DOM
const brushCursor = document.getElementById("brushCursor");

// Draggable panels
const toolsPanel = document.getElementById("toolsPanel");
const usersPanel = document.getElementById("usersPanel");
makeDraggable(toolsPanel);
makeDraggable(usersPanel);

// Canvas + Socket

const engine = createCanvasEngine(canvas);
engine.setCanDraw(() => joined);

const { socket, emitJoin } = connectSocket();

let joined = false;
let lastUsers = [];

// Preset Palette Colors

const PALETTE_COLORS = [
  // Neutrals
  "#000000",
  "#1f2937",
  "#4b5563",
  "#9ca3af",
  "#e5e7eb",
  "#ffffff",

  // Reds / Pinks
  "#ef4444",
  "#dc2626",
  "#f43f5e",
  "#be123c",
  "#fb7185",
  "#fecdd3",

  // Oranges / Yellows
  "#f97316",
  "#ea580c",
  "#f59e0b",
  "#d97706",
  "#eab308",
  "#fde047",
  "#fef08a",

  // Greens
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#4ade80",
  "#bbf7d0",

  // Teals / Cyans
  "#14b8a6",
  "#0d9488",
  "#06b6d4",
  "#0891b2",
  "#67e8f9",

  // Blues
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#60a5fa",
  "#bfdbfe",

  // Purples
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#a78bfa",
  "#ddd6fe",

  // Browns / Extras
  "#92400e",
  "#a16207",
  "#854d0e",

  // Fun colors
  "#10b981",
  "#84cc16",
  "#f472b6",
  "#c026d3",
];

// Helpers

function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || "global";
}
const roomId = getRoomId();

emitJoin(name, roomId);

function setActiveTool(button) {
  brushBtn.classList.remove("activeTool");
  eraserBtn.classList.remove("activeTool");
  button.classList.add("activeTool");
}

// Toast helper
function showToast(message) {
  if (!appToastEl || !toastBodyEl) return;
  toastBodyEl.textContent = message;
  const toast = new bootstrap.Toast(appToastEl, { delay: 2200 });
  toast.show();
}

// Status helper
function updateStatus() {
  if (!statusCenter) return;

  const toolName = brushBtn.classList.contains("activeTool")
    ? "Brush"
    : "Eraser";
  const width = widthValue?.textContent || "6";
  const color = colorPicker?.value || "#111111";

  statusCenter.textContent = `Tool: ${toolName} | Width: ${width} | Color: ${color}`;
}

// Brush Cursor Preview Logic

function updateBrushCursorStyle() {
  if (!brushCursor) return;

  const width = Number(widthSlider.value || 6);

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

// show/hide cursor on canvas enter/leave
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

// animation while drawing
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

// Palette logic

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

    // white border visible
    if (c.toLowerCase() === "#ffffff") {
      swatch.style.border = "1px solid rgba(0,0,0,0.35)";
    }

    swatch.title = c;
    swatch.addEventListener("click", () => updateSelectedColorUI(c));
    colorPalette.appendChild(swatch);
  }

  updateSelectedColorUI(selectedColor);
}

// render palette
renderPalette();
updateBrushCursorStyle();
updateStatus();

// UI Events

joinBtn.addEventListener("click", () => {
  if (joined) return;

  const name = nameInput.value.trim() || "Anonymous";
  emitJoin(name);

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

// Keyboard shortcuts (Ctrl/Cmd)
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

// Canvas pointer events -> WebSocket

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

// Socket listeners
socket.on("connect", () => {
  if (statusLeft) statusLeft.textContent = "🟢 Connected";
  showToast("🟢 Connected");
});

socket.on("disconnect", () => {
  if (statusLeft) statusLeft.textContent = "🔴 Disconnected";
  showToast("🔴 Disconnected. Trying to reconnect...");
});

// toasts from server
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

// Users UI
function renderUsers(users) {
  usersList.innerHTML = "";
  lastUsers = users;

  if (statusRight) statusRight.textContent = `Users: ${users.length}`;

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

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function fpsLoop() {
  frameCount++;
  const now = performance.now();

  if (now - lastFrameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;

    if (statusFPS) statusFPS.textContent = `FPS: ${fps}`;
  }

  requestAnimationFrame(fpsLoop);
}
fpsLoop();
