export function connectSocket() {
  const socket = io();

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  function emitJoin(name) {
    // basic validation
    if (!name || typeof name !== "string") name = "Anonymous";
    socket.emit("user:join", { name });
  }

  return { socket, emitJoin };
}
