# 🎨 Real-Time Collaborative Canvas

This is a real-time multi-user drawing app where multiple users can draw on the same canvas at the same time.  
Built using **raw HTML Canvas API** + **Socket.io (WebSockets)** with a Node.js backend.

The main focus of this assignment was real-time synchronization and global undo/redo, so that the canvas stays consistent for everyone.

---

## ✅ Tech Stack Used

### Frontend

- HTML
- CSS (Bootstrap 5 for UI)
- Vanilla JavaScript (ES Modules)
- Canvas API (no drawing libraries)

### Backend

- Node.js
- Express
- Socket.io (WebSockets)

---

## ✨ Features Implemented

### Drawing Tools

- Brush tool
- Eraser tool
- Stroke width slider
- Preset color palette + custom color picker

### Real-time Collaboration

- Live drawing sync (users can see strokes while drawing)
- Online users list with assigned colors
- Join/leave notifications (toasts)

### Global Undo / Redo (Hard part)

- Undo/redo works globally across all users
- Server stores the official stroke history and broadcasts canvas state updates

### UI / UX Improvements

- Bootstrap-based UI panels
- Draggable tools/users panels
- Brush cursor preview (shows stroke size)
- Toast notifications:
  - user joined/left
  - undo/redo by user
- FPS counter (bonus performance metric)

---

## 🗂️ Project Structure

collaborative-canvas/
├── client/
│ ├── index.html
│ ├── style.css
│ ├── main.js
│ ├── canvas.js
│ ├── websocket.js
│ └── draggable.js
├── server/
│ ├── server.js
│ ├── rooms.js
│ └── drawing-state.js
├── package.json
└── README.md

## 🚀 Run Locally

### 1) Install dependencies

From the project root:

```bash
npm install

2) Start the server

npm run dev
If dev script is not available:

npm start

3) Open in browser
http://localhost:3000
⚠️ Do not open client/index.html using Live Server (5500).
Socket.io requires the Node server to run.

👥 Testing With Multiple Users
To test collaboration:

Open 2 tabs:

Tab 1 → http://localhost:3000

Tab 2 → http://localhost:3000

OR

Open:

1 normal window + 1 incognito window (recommended)

Then:

Enter different names

Click Join

Draw together and test undo/redo

🧠 How Global Undo/Redo Works
Undo/redo is handled on the server to keep everyone consistent.

Server stores stroke history as an array: strokes[]

Undo removes the last stroke and pushes it to undoStack[]

Redo pops from undoStack[] back to strokes[]

After undo/redo, the server broadcasts full canvas state

Clients clear the canvas and replay strokes in order

⚠️ Known Limitations
Canvas state is stored in memory → server restart clears the drawing

No authentication/login (not required for this task)

Undo/redo is global (shared), not per-user

Brush smoothing is basic (straight segments, no bezier smoothing)

⏳ Time Spent
Approx: 25 hours
Most time went into real-time stroke sync + global undo/redo stability.
```
