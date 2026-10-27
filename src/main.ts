const app = document.querySelector<HTMLElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.style.outline = "1px solid black";
canvas.style.touchAction = "none";
canvas.style.display = "block";
canvas.style.margin = "auto";
app.append(canvas);

// Points use canvas coordinates; each stroke retains its own appearance.
const context = canvas.getContext("2d")!;
type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};
// Completed strokes are in drawing order; undone strokes form a redo stack.
const strokes: Stroke[] = [];
const undone: Stroke[] = [];
let stroke: Stroke;
let activePointer: number | null = null;

// Rebuild pixels from the document and preview after each relevant state change.
function render() {
  undo.disabled = activePointer !== null || strokes.length === 0;
  redo.disabled = activePointer !== null || undone.length === 0;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const item of activePointer === null ? strokes : [...strokes, stroke]) {
    context.strokeStyle = item.color;
    context.lineWidth = item.width;
    context.beginPath();
    context.moveTo(item.points[0].x, item.points[0].y);
    for (const point of item.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
}

// create Redraw button
const redraw = document.createElement("button");
redraw.textContent = "Redraw";
redraw.onclick = render;

// create Clear button: resets ONLY the canvas
const clear = document.createElement("button");
clear.textContent = "Clear Canvas";
clear.onclick = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  activePointer = null;
};

// clear document button: resets the WHOLE document
const clear_doc = document.createElement("button");
clear_doc.textContent = "Clear Document";
clear_doc.onclick = () => {
  strokes.length = 0;
  undone.length = 0;
  activePointer = null;
  render();
};

// create Undo button
const undo = document.createElement("button");
undo.textContent = "Undo";
undo.onclick = () => {
  const item = strokes.pop();
  if (item) undone.push(item);
  render();
};

// create Redo button
const redo = document.createElement("button");
redo.textContent = "Redo";
redo.onclick = () => {
  const item = undone.pop();
  if (item) strokes.push(item);
  render();
};
app.append(redraw, clear, clear_doc, undo, redo);
render();

canvas.addEventListener("pointerdown", (event) => {
  if (activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  stroke = {
    points: [{ x: event.offsetX, y: event.offsetY }],
    color: "black",
    width: 1,
  };
  render();
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer) return;
  stroke.points.push({ x: event.offsetX, y: event.offsetY });
  render();
});

// Save completed stroke and redo history
function finishStroke(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  strokes.push(stroke);
  undone.length = 0;
  activePointer = null;
  render();
}

// Releasing your input or leaving the canvas saves the stroke; canceling it discards the stroke.
canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);
canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  render();
});
