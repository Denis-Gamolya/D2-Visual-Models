const app = document.querySelector<HTMLElement>("#app")!;
const tools = document.querySelector<HTMLElement>("#tools")!;
const operations = document.querySelector<HTMLElement>("#operations")!;
const colors = document.querySelector<HTMLElement>("#colors")!;

const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 300;
canvas.style.outline = "1px solid black";
canvas.style.touchAction = "none";
canvas.style.display = "block";
canvas.style.margin = "auto";
const canvas_ctx = canvas.getContext("2d");
if (canvas_ctx === null) throw new Error("null context");
app.append(canvas);

// export canvas
const export_canvas = document.createElement("canvas");
export_canvas.width = 1.5 * canvas.width;
export_canvas.height = 1.5 * canvas.height;
const export_ctx = export_canvas.getContext("2d");
if (export_ctx === null) throw new Error("null context");

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

const palette: Toolbox[] = [
  {
    stroke_width: 1,
    color: "#a3b18a",
    label: "green1",
    mode: "marker",
    emoji: "🌳",
  },
  {
    stroke_width: 1,
    color: "#588157",
    label: "green2",
    mode: "marker",
    emoji: "🌳",
  },
  {
    stroke_width: 1,
    color: "#3a5a40",
    label: "green3",
    mode: "marker",
    emoji: "🌳",
  },
  {
    stroke_width: 1,
    color: "#936639",
    label: "brown1",
    mode: "marker",
    emoji: "🌳",
  },
  {
    stroke_width: 1,
    color: "#582f0e",
    label: "brown2",
    mode: "marker",
    emoji: "🌳",
  },
  {
    stroke_width: 1,
    color: "black",
    label: "green",
    mode: "marker",
    emoji: "🌳",
  },
];

// Rebuild pixels from the document and preview after each relevant state change.
function render(canvas_context: CanvasRenderingContext2D) {
  undo.disabled = activePointer !== null || strokes.length === 0;
  redo.disabled = activePointer !== null || undone.length === 0;
  canvas_context.clearRect(0, 0, canvas.width, canvas.height);
  for (const item of activePointer === null ? strokes : [...strokes, stroke]) {
    if (item.kind == "stroke") {
      canvas_context.strokeStyle = item.color;
      canvas_context.lineWidth = item.width;
      canvas_context.beginPath();
      canvas_context.moveTo(item.points[0].x, item.points[0].y);
      for (const point of item.points.slice(1)) {
        canvas_context.lineTo(point.x, point.y);
      }
      canvas_context.stroke();
    } else if (item.kind == "emoji") {
      canvas_context.textBaseline = "middle";
      canvas_context.font = `${item.size}px serif`;
      canvas_context.fillText(item.id, item.points.x, item.points.y);
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

// button organization

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

// user input for emoji

const userButtonInput = document.createElement("input");
userButtonInput.type = "text";
userButtonInput.placeholder = "Enter Custom Emoji";
tools.append(userButtonInput);

const addCustomEmoji = document.createElement("button");
addCustomEmoji.textContent = "Add Custom Emoji";
addCustomEmoji.onclick = () => {
  const curr = userButtonInput.value.trim();
  const button = document.createElement("button");
  button.innerText = `${curr}`;
  button.onclick = () => {
    current_tool.mode = "emoji";
    current_tool.emoji = `${curr}`;
  };

  tools.append(button);
};
tools.append(addCustomEmoji, thin, thick);

// emojis (data driven design yay)

if (emojiBox) {
  emojiBox.forEach((Toolbox) => {
    const button = document.createElement("button");
    button.innerText = `${Toolbox.emoji}`;
    button.onclick = () => {
      current_tool.mode = "emoji";
      current_tool.emoji = `${Toolbox.emoji}`;
    };

    tools.append(button);
  });
}

if (palette) {
  palette.forEach((Toolbox) => {
    const button = document.createElement("button");
    button.innerText = "---";
    button.style.backgroundColor = Toolbox.color;
    button.onclick = () => {
      current_tool.color = Toolbox.color, current_tool.mode = "marker";
    };

    colors.append(button);
  });
}

// create Redraw button
const redraw = document.createElement("button");
redraw.textContent = "Redraw";
redraw.onclick = () => render(canvas_ctx);

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
  render(canvas_ctx);
};

// create Undo button
const undo = document.createElement("button");
undo.textContent = "Undo";
undo.onclick = () => {
  const item = strokes.pop();
  if (item) undone.push(item);
  render(canvas_ctx);
};

// create Redo button
const redo = document.createElement("button");
redo.textContent = "Redo";
redo.onclick = () => {
  const item = undone.pop();
  if (item) strokes.push(item);
  render(canvas_ctx);
};

// export

const exportButton = document.createElement("button");
exportButton.textContent = "Export Content";

exportButton.onclick = () => {
  if (export_ctx) {
    export_ctx.setTransform(1.5, 0, 0, 1.5, 0, 0);
    render(export_ctx);

    export_canvas.toBlob((blob) => {
      if (blob === null) {
        return;
      }

      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "export.png";
      downloadLink.click();

      URL.revokeObjectURL(url);
    }, "image/png");
  }
};

operations.append(redraw, clear, clear_doc, undo, redo, exportButton);
render(canvas_ctx);

canvas.addEventListener("pointerdown", (event) => {
  if (activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  if (current_tool.mode == "marker") {
    stroke = {
      points: [{ x: event.offsetX, y: event.offsetY }],
      color: current_tool.color,
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
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer) return;
  const last = stroke.points[stroke.points.length - 1];
  canvas_ctx.strokeStyle = stroke.color;
  canvas_ctx.lineWidth = stroke.width;
  if (current_tool.mode == "marker") {
    canvas_ctx.beginPath();
    canvas_ctx.moveTo(last.x, last.y);
    canvas_ctx.lineTo(event.offsetX, event.offsetY);
    canvas_ctx.stroke();
    stroke.points.push({ x: event.offsetX, y: event.offsetY });
  }
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
  if (canvas_ctx === null) throw new Error("null context");
}

// Releasing your input or leaving the canvas saves the stroke; canceling it discards the stroke.
canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);
canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  render(canvas_ctx);
});

app.append(tools, operations, colors);
