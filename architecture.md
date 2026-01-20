ARCHITECTURE.md

This document explains how the Collaborative Canvas app works internally (frontend + backend), how real-time drawing sync happens, and how global undo/redo is handled.

1) What this project is

A real-time collaborative drawing app where multiple users can draw together on the same canvas.

Core idea:

Frontend draws using HTML Canvas API (no drawing libraries)

Backend sync happens using Node.js + Socket.io

Drawing is streamed live (not after finishing)

Server stores the official stroke history (source of truth)

Undo/redo is global and affects all users

2) Tech Stack

Frontend

HTML

CSS + Bootstrap 5 (UI layout/components)

Vanilla JavaScript (ES Modules)

Canvas API

Backend

Node.js

Express

Socket.io (WebSocket based communication)

3) Folder / File Responsibilities

client/

index.html

UI layout: navbar, tools panel, users panel, canvas, status bar, toast container

style.css

Custom styles for palette, draggable panels, canvas sizing, cursor preview, etc.

main.js

UI controller (join, palette, tool buttons, slider, undo/redo)

Connects websocket + canvas engine

Updates users list + status bar + toast notifications

canvas.js

Drawing engine (Canvas API)

Pointer event handling

Brush / eraser drawing logic

Replays strokes when state is synced (init / undo / redo)

websocket.js

Socket connection wrapper

Exposes connectSocket() and emitJoin()

draggable.js

Makes tools/users panels draggable (UI bonus)

server/

server.js

Express + Socket.io server

Handles realtime collaboration

Receives stroke events + broadcasts to other clients

Stores stroke history and applies global undo/redo

rooms.js

Session manager

Stores room data in memory using Map

Tracks users + drawing state

drawing-state.js

Stores strokes history (strokes[])

Stores redo stack (undoStack[])

Implements undo/redo functions

4) Data Flow (Realtime Drawing)

When a user draws:

Pointer events occur in the browser

canvas.js converts pointer coordinates to canvas coordinates

main.js emits socket events (stroke:start, stroke:move, stroke:end)

server.js receives events and broadcasts them to others

Other clients receive events and draw on their own canvases

This makes drawing visible in real time for everyone.

5) WebSocket / Socket.io Protocol

All socket messages are JSON.

Join Flow

user:join (Client -> Server)
Sent when user clicks Join.

Payload:
{ name: "Srishti" }

Server actions:

assigns random color

adds user to session

sends initial state to joining user

broadcasts updated users list

sends toast notification (join)

init (Server -> Client)
Sent only to the joining user.

Payload:
{
me: { id, name, color },
users: [ { id, name, color }, ... ],
strokes: [ strokeObj, ... ]
}

Client actions:

sets current user info

renders online users list

replays all strokes to rebuild canvas

users:list (Server -> All clients)
Sent when someone joins/leaves.

Payload:
{ users: [ { id, name, color }, ... ] }

Drawing Sync Events

stroke:start
Broadcast when stroke begins (first point).

stroke:move
Broadcast frequently while drawing to make stroke live.

stroke:end
Broadcast when stroke finishes.

Important detail:

Server stores strokes only on stroke:end

This prevents incomplete strokes from being stored

Global Undo/Redo Events

history:undo (Client -> Server)
Undo request.

history:redo (Client -> Server)
Redo request.

canvas:state (Server -> All clients)
Server broadcasts full stroke list after undo/redo.

Payload:
{ strokes: [ strokeObj, ... ] }

Client action:

clears canvas

replays strokes list in order

Toast Notifications

toast:event (Server -> All clients)
Used to show messages like:

“Srishti joined”

“Aditi left”

“Undo by Rahul”

Payload example:
{ type: "join", user: "Srishti" }

6) Global Undo/Redo Strategy

Undo/redo is handled on the server to keep all clients consistent.

Server-side data structures:

strokes[] : main stroke history (Array)

undoStack[] : redo stack (Array)

Undo

remove last stroke from strokes[]

push it into undoStack[]

broadcast canvas:state to everyone

Redo

pop from undoStack[]

push back into strokes[]

broadcast canvas:state again

Why server-side?

avoids mismatch between clients

prevents different users seeing different history

server remains the single source of truth

7) Conflict Resolution

If multiple users draw in the same area:

strokes are layered in draw order

later strokes appear on top

Canvas layering order naturally acts as conflict resolution.

8) Performance Decisions

To keep drawing smooth:

stroke points are streamed live (move events)

canvas is not redrawn fully on every pointer move

full redraw happens only on:

first join (init)

undo/redo (canvas:state)

Bonus:

FPS counter added to observe performance responsiveness

9) Error Handling

Client:

drawing is blocked until user joins

connection status is shown in UI

Server:

validates payloads for join + stroke events

uses safe try/catch in key handlers

avoids crashing on malformed events

10) Known Limitations

data is stored only in memory (server restart clears canvas)

no authentication

undo/redo is global (not per-user undo)

stroke smoothing is basic (straight segments)

11) Future Improvements

If extended further:

persistence (save/load sessions)

proper multi-room support

shapes/text tools

better smoothing (bezier curves)

remote cursor indicators with user colors
