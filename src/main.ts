const app = document.querySelector<HTMLElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.style.outline = "1px solid black";
canvas.style.touchAction = "none";
app.append(canvas);

const context = canvas.getContext("2d")!;
type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};
const strokes: Stroke[] = [];
let stroke: Stroke;
let activePointer: number | null = null;

function render() {
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

const redraw = document.createElement("button");
redraw.textContent = "Redraw";
redraw.onclick = render;
const clear = document.createElement("button");
clear.textContent = "Clear";
clear.onclick = () => {
  strokes.length = 0;
  activePointer = null;
  render();
};
app.append(redraw, clear);

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

function finishStroke(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  strokes.push(stroke);
  activePointer = null;
  render();
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
