export class LineRenderer {
  constructor(ctx) {
    this.originalCtx = ctx;

    // Create a buffer
    this.buffer = document.createElement("canvas");
    this.ctx = this.buffer.getContext("2d", {
      alpha: ctx.alpha,
    });
    this.update();

    // Manage points
    this.last = { x: 0, y: 0 };
    this.ps = [];
    this.dirty = new DirtyRect();
    this.predictionDirty = new DirtyRect();
  }

  // Match the transform of the supplied context
  update() {
    this.buffer.width = this.originalCtx.canvas.width;
    this.buffer.height = this.originalCtx.canvas.height;
    this.ctx.setTransform(this.originalCtx.getTransform());
  }

  // Clear the entire surface
  clear() {
    const t = this.ctx.getTransform();
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.ctx.setTransform(t);
  }

  // Copy from the buffer to the screen
  // Optionally, only copy the damaged area for more performance
  copy(partial) {
    if (partial) {
      if (this.dirty.empty) {
        return;
      }

      // Account for transformations
      const m = this.ctx.getTransform();
      const transformed = new DirtyRect();
      transformed.add(m.transformPoint(this.dirty.min));
      transformed.add(m.transformPoint(this.dirty.max));

      const PADDING = 2;
      const img = this.ctx.getImageData(
        transformed.min.x - PADDING,
        transformed.min.y - PADDING,
        transformed.width + PADDING * 2,
        transformed.height + PADDING * 2
      );

      // Copy just the dirty region, with some padding
      this.originalCtx.putImageData(
        img,
        transformed.min.x - PADDING,
        transformed.min.y - PADDING
      );
    } else {
      const img = this.ctx.getImageData(
        0,
        0,
        this.buffer.width,
        this.buffer.height
      );

      this.originalCtx.putImageData(img, 0, 0);
    }
    this.dirty.reset();
  }

  down(p) {
    this.last = p;
    this.ps = [];

    this.dirty.reset();
    this.predictionDirty.reset();
    this.dirty.add(p);
  }
  move(ps) {
    // Add the previous prediction region if one exists, so it's cleared
    if (!this.predictionDirty.empty) {
      this.dirty.add(this.predictionDirty.min);
      this.dirty.add(this.predictionDirty.max);
      this.predictionDirty.reset();
    }

    let last = this.last;
    this.dirty.add(last);
    for (let p of ps) {
      this.ctx.beginPath();
      this.ctx.moveTo(last.x, last.y);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
      last = p;
      this.ps.push(p);
      this.dirty.add(p);
    }
    this.last = last;
  }
  prediction(ps) {
    let last = this.last;
    this.dirty.add(last);
    for (let p of ps) {
      this.originalCtx.beginPath();
      this.originalCtx.moveTo(last.x, last.y);
      this.originalCtx.lineTo(p.x, p.y);
      this.originalCtx.stroke();
      last = p;
      this.predictionDirty.add(p);
      this.dirty.add(p);
    }
  }
  up() {
    const ps = this.ps;
    this.ps = [];
    return ps;
  }

  stroke(ps) {
    if (ps.length === 0) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(ps[0].x, ps[0].y);
    this.dirty.add(ps[0]);
    for (let i = 1; i < ps.length; i++) {
      this.ctx.lineTo(ps[i].x, ps[i].y);
      this.dirty.add(ps[i]);
    }
    this.ctx.stroke();
  }
}

class DirtyRect {
  constructor() {
    this.empty = true;
    this.min = { x: 0, y: 0 };
    this.max = { y: 0, y: 0 };
  }

  get width() {
    return this.max.x - this.min.x;
  }
  get height() {
    return this.max.y - this.min.y;
  }

  add(p) {
    if (this.empty) {
      this.min = p;
      this.max = p;
      this.empty = false;
    } else {
      this.min = {
        x: Math.min(this.min.x, p.x),
        y: Math.min(this.min.y, p.y),
      };
      this.max = {
        x: Math.max(this.max.x, p.x),
        y: Math.max(this.max.y, p.y),
      };
    }
  }
  reset() {
    this.empty = true;
  }
}
