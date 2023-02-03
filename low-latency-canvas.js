export class LowLatencyCanvas extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    // Add styles
    const style = document.createElement("style");
    style.innerHTML = `
        :host {display: flex;}
        canvas {transform-origin: left top;}
    `;
    shadow.appendChild(style);

    // Add canvas
    this.canvas = document.createElement("canvas");
    shadow.appendChild(this.canvas);

    this.width = 300; // Width in CSS pixels
    this.height = 150; // Height in CSS pixels
    this.angle = 0; // Screen rotation
    this.transforms = {
      translation: { x: 0, y: 0 },
      rotation: 0,
      scale: 1,
    };

    this.rotateListener = this.onScreenRotate.bind(this);
  }

  /* PUBLIC METHODS */

  getContext(type, options) {
    return this.canvas.getContext(type, options);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.update();
  }

  // Hide the canvas synchronously with rendering to a dry layer for a clean hand-off.
  // Optional callback to clear/edit this low-latency canvas while hidden.
  commit(optionalCallback) {
    this.style.opacity = "0";
    setTimeout(() => {
      if (optionalCallback) {
        optionalCallback();
      }
      this.style.opacity = "1";
    }, 16 * 5); // Wait 5 frames to ensure it's hidden before clearing...
  }

  /* PRIVATE METHODS */

  connectedCallback() {
    this.angle = simplifyAngle(-window.screen.orientation.angle);
    window.screen.orientation.addEventListener("change", this.rotateListener);
    this.update();
  }
  disconnectedCallback() {
    window.screen.orientation.removeEventListener(
      "change",
      this.rotateListener
    );
  }

  onScreenRotate() {
    this.angle = simplifyAngle(window.screen.orientation.angle);
    this.update();
  }

  update() {
    // Snap canvas dimensions to pixels
    let width = cssToRoundedPhysicalPixels(this.width);
    let height = cssToRoundedPhysicalPixels(this.height);

    // Flip dimensions if rotated 90/270
    if (this.angle === 90 || this.angle === 270) {
      [width, height] = [height, width];
    }

    const cssWidth = width / devicePixelRatio;
    const cssHeight = height / devicePixelRatio;

    // Update canvas dimensions for HiDPI displays
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    // Shift the canvas as needed
    const angle = this.angle;
    const { x, y } = getShift(angle, cssWidth, cssHeight);
    this.canvas.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

    console.log("update...");
    this.transforms = {
      rotation: -angle,
      translation: { x: -x, y: -y },
      scale: devicePixelRatio,
    };
    // Let clients know to re-render with a new transform
    this.dispatchEvent(
      new CustomEvent("canvas-change", {
        detail: this.transforms,
      })
    );
  }
}

function cssToRoundedPhysicalPixels(cssPixels) {
  return Math.floor(cssPixels * devicePixelRatio);
}

function simplifyAngle(angle) {
  angle = angle % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}
function getShift(angle, x, y) {
  switch (simplifyAngle(angle)) {
    case 0:
      return { x: 0, y: 0 };
    case 90:
      return { x: y, y: 0 };
    case 180:
      return { x, y };
    case 270:
      return { x: 0, y: x };
    default:
      throw new Error("Unsupported angle for rotation");
  }
}
