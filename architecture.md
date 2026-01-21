# 🏗️ Architecture – Collaborative Canvas

This document explains the system architecture of the **Collaborative Canvas** project — a real-time multi-user drawing application built using **Node.js + Express + Socket.io + HTML Canvas API**.

---

## 1) 📌 High-Level Overview

Collaborative Canvas is a **real-time shared whiteboard** where multiple users can:

- join the same room
- draw together simultaneously
- see others’ strokes live
- use global undo/redo
- view online users count in real time

The system uses:

- **Frontend**: HTML + CSS + Bootstrap + Vanilla JS + Canvas API
- **Backend**: Node.js + Express
- **Realtime Protocol**: Socket.io (WebSocket events)

---

## 2) 🧩 Components

### ✅ Frontend (Client)

Located in `/client`:

- `index.html` → UI layout (Navbar, Toolbar, Canvas, Status bar)
- `style.css` → styling
- `main.js` → UI handling, tool actions, socket event wiring
- `canvas.js` → canvas engine (draw, replay strokes, cursor handling)
- `websocket.js` → socket connection + join emitter

### ✅ Backend (Server)

Located in `/server`:

- `server.js` → Express server + Socket.io events
- `rooms.js` → room manager (users + drawing state per room)
- `drawing-state.js` → stroke history + undo/redo stacks

---

## 3) 🗂️ Folder Structure

```txt
Collaborative-Canvas/
│
├── client/
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── canvas.js
│   ├── websocket.js
│   ├── draggable.js   (optional)
│
├── server/
│   ├── server.js
│   ├── rooms.js
│   ├── drawing-state.js
│
├── package.json
├── README.md
└── ARCHITECTURE.md

4) 🔁 Data Flow Diagram (Drawing Events Flow)

This section shows how the user’s strokes travel from browser → server → all clients and finally get rendered on canvas.

✅ Data Flow (Step by Step)

User draws on canvas (pointer events)

Canvas Engine generates stroke payload

Client emits Socket.io event to server

Server updates room drawing state

Server broadcasts stroke event to all connected clients in the room

Each client renders the stroke on its canvas

┌─────────────┐
│   User A    │
│ (Browser)   │
└─────┬───────┘
      │ pointer events
      v
┌─────────────┐
│ Canvas Engine│
│ (client.js) │
└─────┬───────┘
      │ stroke payload
      v
┌──────────────────────────┐
│   Socket.io Client Emit   │
│ stroke:start/move/end     │
└───────────┬──────────────┘
            │ WebSocket
            v
┌──────────────────────────┐
│       Node.js Server      │
│  Socket.io Event Handler  │
└───────────┬──────────────┘
            │ stores stroke in memory
            │ broadcasts to room
            v
┌──────────────────────────────┐
│   All Clients in Same Room    │
│ receive + render stroke event │
└──────────────────────────────┘

5) 🔌 WebSocket Protocol (Socket.io Events)
✅ Client → Server Events
Event	Payload	Purpose
join	{ name, roomId }	Join a room and register user
stroke:start	{ x, y, color, width, tool }	Begin stroke
stroke:move	{ x, y }	Continue stroke
stroke:end	{ x, y }	End stroke
cursor:move	{ x, y }	Optional live cursor tracking
history:undo	{}	Global undo request
history:redo	{}	Global redo request
✅ Server → Client Events
Event	Payload	Purpose
init	{ me, users, strokes }	Send initial state on join
users:list	{ users }	Updated online users list
stroke:start	stroke payload	Broadcast stroke start
stroke:move	stroke payload	Broadcast stroke move
stroke:end	stroke payload	Broadcast stroke end
canvas:state	{ strokes }	Full canvas state after undo/redo
toast:event	{ type, user }	UI notifications
6) ↩️ Undo/Redo Strategy (Global)

Undo/Redo in this app is global, meaning:

✅ If User A presses Undo
➡️ Everyone sees the same undo on their canvas.

This is intentionally handled on the server to avoid inconsistencies.

✅ Data Structures (Server Side)

The drawing state maintains:

strokes[] → all committed strokes

undoStack[] → undone strokes stored here

✅ Undo Logic
Undo:
- remove last element from strokes[]
- push it into undoStack[]
- broadcast full strokes[] as canvas:state

✅ Redo Logic
Redo:
- pop from undoStack[]
- push back into strokes[]
- broadcast full strokes[] as canvas:state

✅ Why Broadcast Full Canvas State?

Undo/Redo modifies the stroke history drastically.
Broadcasting a full canvas state guarantees:

every client is perfectly synced

no client mismatch issues

consistent global replay

7) ⚡ Performance Decisions

Real-time apps can lag if not optimized, so these decisions were made:

✅ 1. Send small messages

Stroke move events contain only required data like {x, y} instead of sending full canvas image data.

✅ 2. Replay strokes only when needed

Normal drawing uses incremental rendering.
Canvas replay happens only on:

first join (init strokes)

undo/redo (canvas:state)

✅ 3. In-memory state (fast)

Drawing state is stored in memory for low-latency performance.

Tradeoff: server restart clears canvas.

✅ 4. Avoid unnecessary redraws

The canvas engine draws strokes directly during pointer movement.

8) ⚔️ Conflict Resolution (Simultaneous Drawing)

In collaborative drawing, multiple users may draw at the same time.

✅ Strategy Used

Event Ordering + Independent Strokes

Each user’s drawing stroke is treated independently.

The server broadcasts stroke events in the order they arrive.

Clients render events sequentially.

Why this works

Canvas is naturally additive:

overlapping strokes are allowed

no hard conflicts exist (like editing the same text)

later strokes simply draw over earlier strokes

✅ Global Undo/Redo Conflict Handling

Undo/Redo is handled with strict server authority:

server determines which stroke is last

server broadcasts the updated state

clients do not decide history locally

This prevents:

different undo history per user

mismatched canvas states

9) 🧠 Room-Based Architecture

Each room has:

users: Map(socketId → user)

drawing: DrawingState

So collaboration is scalable for multiple rooms:

rooms Map:
  roomId → {
    users,
    drawingState
  }

10) ✅ Limitations / Known Constraints

Drawing state is stored only in RAM → server restart clears drawing

No authentication / access control

Undo/redo is global (shared), not per-user

Brush smoothing is basic (straight segments)

✅ Conclusion

This architecture provides:

reliable real-time collaboration

consistent global history

scalable room management

efficient message passing through WebSockets

It is lightweight, simple to run locally, and ready for deployment (Render).
```
