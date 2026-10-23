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

canvas.addEventListener("pointerdown", (event) => {
  if (activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  stroke = {
    points: [{ x: event.offsetX, y: event.offsetY }],
    color: "black",
    width: 1,
  };
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer) return;
  stroke.points.push({ x: event.offsetX, y: event.offsetY });
  context.lineTo(event.offsetX, event.offsetY);
  context.stroke();
});

function finishStroke(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  strokes.push(stroke);
  activePointer = null;
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
