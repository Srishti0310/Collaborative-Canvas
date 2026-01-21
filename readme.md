# 🎨 Collaborative Canvas (Real-Time Whiteboard)

A real-time collaborative drawing application where multiple users can join the same room and draw together live.  
Built using **HTML Canvas API + Node.js + Express + Socket.io** with server-managed **global Undo/Redo**.

---

## 🌐 Deployed Demo

✅ Live Demo Link: https://collaborative-canvas-1-hijr.onrender.com

## ✨ Features

- 🧑‍🤝‍🧑 Multi-user real-time drawing (Socket.io)
- 🎨 Brush + Eraser tools
- 🎚️ Stroke width control
- 🌈 Color palette + custom color picker
- ↩️ Global Undo / Redo (server consistent)
- 👥 Online users count
- ⚡ Lightweight UI (no drawing libraries used)

---

## 🛠️ Tech Stack

**Frontend**

- HTML5 Canvas API
- CSS3 + Bootstrap
- Vanilla JavaScript

**Backend**

- Node.js
- Express.js
- Socket.io

---

## 🚀 Setup & Run Locally

### ✅ 1) Install dependencies

From project root:

```bash
npm install

2) Start the server
npm start


or if you have a dev script:

npm run dev

✅ 3) Open in browser
http://localhost:3000


⚠️ Do NOT open client/index.html with Live Server (5500)
Socket.io requires the Node server running.

👥 Testing With Multiple Users

To test collaboration locally:

✅ Option 1: Two browser tabs

Open Tab 1 → http://localhost:3000

Open Tab 2 → http://localhost:3000

✅ Option 2 (Recommended): Normal + Incognito

Open http://localhost:3000 in a normal window

Open http://localhost:3000 in an incognito window

Then:

Enter different names

Click Join

Draw together and test undo/redo

🧠 How Global Undo/Redo Works

Undo/Redo is handled on the server side to keep all connected clients consistent.

Server state:

strokes[] → stores all committed strokes

undoStack[] → stores undone strokes

Undo:

Remove last stroke from strokes[]

Push it into undoStack[]

Server broadcasts full canvas state

Redo:

Pop from undoStack[]

Push back into strokes[]

Server broadcasts full canvas state

✅ Clients clear the canvas and replay all strokes in order.

⚠️ Known Limitations / Bugs

Canvas state is stored in-memory, so server restart clears drawing

No authentication / login

Undo/Redo is global, shared between all users (not per-user)

Brush smoothing is basic (straight segments)

If too many users draw rapidly, strokes may appear slightly delayed (network latency)

⏳ Time Spent

Approx: 20-22 hours

Most time went into:

Real-time stroke syncing logic

Keeping global undo/redo consistent for all users

UI improvements + toolbar layout adjustments

📌 Notes

No drawing libraries were used (only raw Canvas API)

Socket.io is used for reliable real-time messaging and broadcasting
```
