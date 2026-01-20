// Node + Socket.io backend for realtime collaborative drawing.
// Server stores the official strokes history (needed for global undo/redo).

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const Rooms = require("./rooms");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Rooms();

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "client")));

io.on("connection", (socket) => {
  console.log(" New socket connected:", socket.id);

  // Global only room
  const roomId = "global";

  // User Join (Global)
  socket.on("user:join", ({ name }) => {
    socket.join(roomId);

    const user = rooms.addUser(roomId, socket.id, name);
    const drawing = rooms.getDrawing(roomId);

    socket.emit("init", {
      me: user,
      users: rooms.getUsers(roomId),
      strokes: drawing.getState().strokes,
    });

    io.to(roomId).emit("users:list", {
      users: rooms.getUsers(roomId),
    });

    io.to(roomId).emit("toast:event", {
      type: "join",
      user: user.name,
    });

    console.log(`👤 ${user.name} joined`);
  });

  // Stroke streaming (live)
  socket.on("stroke:start", (payload) => {
    socket.to(roomId).emit("stroke:start", payload);
  });

  socket.on("stroke:move", (payload) => {
    socket.to(roomId).emit("stroke:move", payload);
  });

  socket.on("stroke:end", (payload) => {
    const drawing = rooms.getDrawing(roomId);

    if (payload?.stroke) {
      drawing.addStroke(payload.stroke);
    }

    io.to(roomId).emit("stroke:end", payload);
  });

  // Cursor updates
  socket.on("cursor:move", (payload) => {
    socket.to(roomId).emit("cursor:update", payload);
  });

  // Drawing indicator

  socket.on("user:drawing", ({ isDrawing }) => {
    io.to(roomId).emit("user:drawing", {
      userId: socket.id,
      isDrawing: !!isDrawing,
    });
  });

  // Ping latency
  socket.on("ping:check", ({ t0 }) => {
    socket.emit("pong:check", { t0 });
  });

  // Undo/Redo (global)
  socket.on("history:undo", () => {
    const drawing = rooms.getDrawing(roomId);
    drawing.undo();

    io.to(roomId).emit("canvas:state", {
      strokes: drawing.getState().strokes,
    });

    // toast undo by user
    const users = rooms.getUsers(roomId);
    const u = users.find((x) => x.id === socket.id);

    io.to(roomId).emit("toast:event", {
      type: "undo",
      user: u?.name || "Someone",
    });
  });

  socket.on("history:redo", () => {
    const drawing = rooms.getDrawing(roomId);
    drawing.redo();

    io.to(roomId).emit("canvas:state", {
      strokes: drawing.getState().strokes,
    });

    // toast redo by user
    const users = rooms.getUsers(roomId);
    const u = users.find((x) => x.id === socket.id);

    io.to(roomId).emit("toast:event", {
      type: "redo",
      user: u?.name || "Someone",
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const leftUser = rooms.removeUser(roomId, socket.id);

    io.to(roomId).emit("users:list", {
      users: rooms.getUsers(roomId),
    });

    io.to(roomId).emit("cursor:leave", {
      userId: socket.id,
    });

    if (leftUser) {
      io.to(roomId).emit("toast:event", {
        type: "leave",
        user: leftUser.name,
      });

      console.log(`👋 ${leftUser.name} left`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
