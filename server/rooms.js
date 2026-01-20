const DrawingState = require("./drawing-state");

// picks a random user color so each user looks different in UI
function randomColor() {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#9b59b6",
    "#f39c12",
    "#1abc9c",
    "#e67e22",
    "#34495e",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

class Rooms {
  constructor() {
    // stores roomId -> { users, drawing }
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    // create room only when someone joins it
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(), // socketId -> user object
        drawing: new DrawingState(), // stores strokes + undo/redo
      });
    }
    return this.rooms.get(roomId);
  }

  addUser(roomId, socketId, name) {
    const room = this.getOrCreateRoom(roomId);

    // user object stored in memory (no DB here)
    const user = {
      id: socketId,
      name: name || "Anonymous",
      color: randomColor(),
    };

    room.users.set(socketId, user);
    return user;
  }

  removeUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // return removed user so we can show "X left" toast
    const user = room.users.get(socketId);

    room.users.delete(socketId);
    return user;
  }

  getUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    // convert Map values to array for sending to client
    return Array.from(room.users.values());
  }

  getDrawing(roomId) {
    // drawing state exists per room
    return this.getOrCreateRoom(roomId).drawing;
  }
}

module.exports = Rooms;
