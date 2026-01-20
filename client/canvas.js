export function createCanvasEngine(canvas) {
  const ctx = canvas.getContext("2d");

  // State

  let tool = "brush";
  let strokeColor = "#111111";
  let strokeWidth = 6;

  let myUser = null;
  let isDrawing = false;

  let currentStroke = null;

  //  main.js can control whether drawing is allowed
  let canDrawFn = () => true;

  // Remote strokes (live in-progress)
  const remoteStrokes = new Map(); // strokeId -> stroke object

  // HiDPI / Resize handling
  function resizeCanvasToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = Math.round(rect.width * dpr);
    const displayHeight = Math.round(rect.height * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  resizeCanvasToDisplaySize();

  window.addEventListener("resize", () => {
    resizeCanvasToDisplaySize();
  });

  // FIXED COORDINATE CONVERSION

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Stroke drawing

  function applyToolStyle(stroke) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.width;

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
    }
  }

  function drawStroke(stroke) {
    const pts = stroke.points;
    if (!pts || pts.length < 2) return;

    applyToolStyle(stroke);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.stroke();
    ctx.closePath();

    ctx.globalCompositeOperation = "source-over";
  }

  function drawStrokeSegment(stroke, fromIndex) {
    const pts = stroke.points;
    if (!pts || pts.length < 2) return;

    applyToolStyle(stroke);

    const i0 = Math.max(0, fromIndex - 1);

    ctx.beginPath();
    ctx.moveTo(pts[i0].x, pts[i0].y);

    for (let i = i0 + 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.stroke();
    ctx.closePath();

    ctx.globalCompositeOperation = "source-over";
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Public API

  function setUser(u) {
    myUser = u;
  }

  function setTool(t) {
    tool = t;
  }

  function setColor(c) {
    strokeColor = c;
  }

  function setWidth(w) {
    strokeWidth = w;
  }

  // controlled by main.js
  function setCanDraw(fn) {
    canDrawFn = fn;
  }

  function replayStrokes(strokes) {
    resizeCanvasToDisplaySize();
    clearCanvas();

    if (!strokes || !Array.isArray(strokes)) return;

    for (const s of strokes) drawStroke(s);
  }

  // Pointer handlers

  function bindPointerHandlers({
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onCursorMove,
  }) {
    // pointerdown: start stroke
    canvas.addEventListener("pointerdown", (e) => {
      if (!myUser) return;

      // IMPORTANT ERROR HANDLING :
      // if user has not joined, block drawing locally also
      if (!canDrawFn()) return;

      resizeCanvasToDisplaySize();

      isDrawing = true;
      canvas.setPointerCapture(e.pointerId);

      const point = getPoint(e);
      const strokeId = crypto.randomUUID();

      currentStroke = {
        id: strokeId,
        userId: myUser.id,
        tool,
        color: strokeColor,
        width: strokeWidth,
        points: [point],
      };

      onStrokeStart?.({
        strokeId,
        userId: myUser.id,
        tool,
        color: strokeColor,
        width: strokeWidth,
        point,
      });
    });

    // pointermove: add points
    canvas.addEventListener("pointermove", (e) => {
      if (!myUser) return;

      const p = getPoint(e);

      onCursorMove?.({
        userId: myUser.id,
        x: p.x,
        y: p.y,
      });

      if (!isDrawing || !currentStroke) return;

      currentStroke.points.push(p);

      // local drawing for smoothness
      drawStrokeSegment(currentStroke, currentStroke.points.length - 2);

      onStrokeMove?.({
        strokeId: currentStroke.id,
        userId: myUser.id,
        point: p,
      });
    });

    // pointerup: end stroke
    canvas.addEventListener("pointerup", (e) => {
      if (!myUser) return;
      if (!isDrawing || !currentStroke) return;

      isDrawing = false;
      canvas.releasePointerCapture(e.pointerId);

      onStrokeEnd?.({
        strokeId: currentStroke.id,
        userId: myUser.id,
        stroke: currentStroke,
      });

      currentStroke = null;
    });

    // safety
    canvas.addEventListener("pointercancel", () => {
      isDrawing = false;
      currentStroke = null;
    });
  }

  // Remote strokes handlers
  function onRemoteStrokeStart(payload) {
    const { strokeId, userId, tool, color, width, point } = payload || {};
    if (!strokeId || !point) return;

    remoteStrokes.set(strokeId, {
      id: strokeId,
      userId,
      tool,
      color,
      width,
      points: [point],
    });
  }

  function onRemoteStrokeMove(payload) {
    const { strokeId, point } = payload || {};
    if (!strokeId || !point) return;

    const stroke = remoteStrokes.get(strokeId);
    if (!stroke) return;

    stroke.points.push(point);

    drawStrokeSegment(stroke, stroke.points.length - 2);
  }

  function onRemoteStrokeEnd(payload) {
    const { strokeId } = payload || {};
    if (!strokeId) return;

    remoteStrokes.delete(strokeId);
  }

  // Exposed Engine

  return {
    setUser,
    setTool,
    setColor,
    setWidth,
    setCanDraw,

    bindPointerHandlers,

    replayStrokes,

    onRemoteStrokeStart,
    onRemoteStrokeMove,
    onRemoteStrokeEnd,
  };
}
