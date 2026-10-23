const app = document.querySelector<HTMLElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.style.outline = "1px solid black";
canvas.style.touchAction = "none";
app.append(canvas);

const context = canvas.getContext("2d")!;
let activePointer: number | null = null;

canvas.addEventListener("pointerdown", (event) => {
  if (activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer) return;
  context.lineTo(event.offsetX, event.offsetY);
  context.stroke();
});

function finishStroke(event: PointerEvent) {
  if (event.pointerId === activePointer) activePointer = null;
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
