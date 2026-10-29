const app = document.querySelector<HTMLElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;
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
  kind: "stroke";
};
type Emoji = {
  points: { x: number; y: number };
  id: string;
  size: number;
  kind: "emoji";
};
// Completed strokes are in drawing order; undone strokes form a redo stack.
const strokes: (Stroke | Emoji)[] = [];
const undone: (Stroke | Emoji)[] = [];
let stroke: Stroke;
let emoji: Emoji;
let activePointer: number | null = null;

// tools !!
interface Toolbox {
  stroke_width: number;
  color: string;
  label: string;
  mode: string;
  emoji: string;
}

const current_tool: Toolbox = {
  stroke_width: 1,
  color: "black",
  label: "thin",
  mode: "marker",
  emoji: "🌳",
};

const emojiBox: Toolbox[] = [{
  stroke_width: 22,
  color: "black",
  label: "tree",
  mode: "emoji",
  emoji: "🌳",
}, {
  stroke_width: 22,
  color: "black",
  label: "palm_tree",
  mode: "emoji",
  emoji: "🌴",
}, {
  stroke_width: 22,
  color: "black",
  label: "pine_tree",
  mode: "emoji",
  emoji: "🌲",
}];

// Rebuild pixels from the document and preview after each relevant state change.
function render() {
  undo.disabled = activePointer !== null || strokes.length === 0;
  redo.disabled = activePointer !== null || undone.length === 0;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const item of activePointer === null ? strokes : [...strokes, stroke]) {
    if (item.kind == "stroke") {
      context.strokeStyle = item.color;
      context.lineWidth = item.width;
      context.beginPath();
      context.moveTo(item.points[0].x, item.points[0].y);
      for (const point of item.points.slice(1)) {
        context.lineTo(point.x, point.y);
      }
      context.stroke();
    } else if (item.kind == "emoji") {
      context.textBaseline = "middle";
      context.font = `${item.size}px serif`;
      context.fillText(item.id, item.points.x, item.points.y);
    }
  }

  if (current_tool.stroke_width == 1) {
    thin.disabled = true;
    thick.disabled = false;
  } else {
    thin.disabled = false;
    thick.disabled = true;
  }
}

// create the actual tool buttons
const thin = document.createElement("button");
thin.textContent = "Thin Marker";
thin.onclick = () => {
  current_tool.stroke_width = 1;
  current_tool.mode = "marker";
};

const thick = document.createElement("button");
thick.textContent = "Thick Marker";
thick.onclick = () => {
  current_tool.stroke_width = 5;
  current_tool.mode = "marker";
};

// emojis (data driven design yay)

if (emojiBox) {
  emojiBox.forEach((Toolbox) => {
    const button = document.createElement("button");
    button.innerText = `${Toolbox.emoji}`;
    button.onclick = () => {
      current_tool.mode = "emoji";
      current_tool.emoji = `${Toolbox.emoji}`;
    };

    app.append(button);
  });
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
app.append(redraw, clear, clear_doc, undo, redo, thin, thick);
render();

canvas.addEventListener("pointerdown", (event) => {
  if (activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  if (current_tool.mode == "marker") {
    stroke = {
      points: [{ x: event.offsetX, y: event.offsetY }],
      color: "black",
      width: current_tool.stroke_width,
      kind: "stroke",
    };
  } else if (current_tool.mode == "emoji") {
    emoji = {
      points: { x: event.offsetX, y: event.offsetY },
      id: current_tool.emoji,
      size: 22,
      kind: "emoji",
    };
  }
  render();
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer) return;
  if (current_tool.mode == "marker") {
    stroke.points.push({ x: event.offsetX, y: event.offsetY });
  }
  render();
});

// Save completed stroke and redo history
function finishStroke(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  if (current_tool.mode == "marker") {
    strokes.push(stroke);
  } else if (current_tool.mode == "emoji") {
    strokes.push(emoji);
  }
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
