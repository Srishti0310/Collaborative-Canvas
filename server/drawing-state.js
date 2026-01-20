// Stores canvas as an array of stroke operations.
// Undo/redo is handled using strokes[] + undoStack[].

// olds the canonical drawing state for a room
class DrawingState {
  constructor() {
    this.strokes = []; // visible strokes
    this.undoStack = []; // undone strokes
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
    this.undoStack = []; // new action clears redo chain
  }

  undo() {
    if (this.strokes.length === 0) return false;
    const last = this.strokes.pop();
    this.undoStack.push(last);
    return true;
  }

  redo() {
    if (this.undoStack.length === 0) return false;
    const last = this.undoStack.pop();
    this.strokes.push(last);
    return true;
  }

  getState() {
    return {
      strokes: this.strokes,
    };
  }
}

module.exports = DrawingState;
