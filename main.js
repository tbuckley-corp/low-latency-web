import { LineRenderer } from "./line-renderer.js";
import { LowLatencyCanvas } from "./low-latency-canvas.js";
import { Predictor } from "./prediction/Predictor.js";

customElements.define("low-latency-canvas", LowLatencyCanvas);

const dry = document.querySelector("#dry");
const dryRenderer = new LineRenderer(
  dry.getContext("2d", {
    alpha: true,
  })
);

const wet = document.querySelector("#wet");
const wetRenderer = new LineRenderer(
  wet.getContext("2d", {
    alpha: true,
    desynchronized: true,
  })
);

// Make the canvases full-screen
function updateSizes() {
  dry.style.width = `${window.innerWidth}px`;
  dry.style.height = `${window.innerHeight}px`;
  dry.width = window.innerWidth * devicePixelRatio;
  dry.height = window.innerHeight * devicePixelRatio;
  dryRenderer.ctx.resetTransform();
  dryRenderer.ctx.scale(devicePixelRatio, devicePixelRatio);

  // Inset wet layer by 5 physical pixels left/right/bottom
  // to avoid issues with rounded corners
  wet.setDimensions(
    window.innerWidth - 10 / devicePixelRatio,
    window.innerHeight - 5 / devicePixelRatio
  );
  wet.style.left = `${5 / devicePixelRatio}px`;
}
updateSizes();
window.addEventListener("resize", updateSizes);

// Transform the low-latency canvas's rendering context to
// offset any rotation/translation
function updateTransforms(t) {
  wetRenderer.ctx.resetTransform();
  wetRenderer.ctx.translate(-5, 0); // Make up for padding
  wetRenderer.ctx.scale(t.scale, t.scale);
}
wet.addEventListener("canvas-change", (e) => {
  updateTransforms(e.detail);
});
updateTransforms(wet.transforms);

// Handle input and render
const predictor = new Predictor(16);
dry.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    dry.setPointerCapture(e.pointerId);
    wetRenderer.down({ x: e.offsetX, y: e.offsetY });
    predictor.initStrokePrediction();
    predictor.update(e.offsetX, e.offsetY, e.pressure, e.timeStamp);
  }
});
dry.addEventListener("pointerrawupdate", (e) => {
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    wetRenderer.move([{ x: e.offsetX, y: e.offsetY }]);

    // Render prediction
    predictor.update(e.offsetX, e.offsetY, e.pressure, e.timeStamp);
    const prediction = predictor.predict();
    wetRenderer.prediction(prediction);
  }
});
dry.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    const ps = wetRenderer.up();
    wet.commit(() => {
      wetRenderer.ctx.clearRect(0, 0, wet.width, wet.height);
    });
    dryRenderer.stroke(ps);
  }
});
