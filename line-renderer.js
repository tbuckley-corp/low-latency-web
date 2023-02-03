export class LineRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.last = { x: 0, y: 0 };
    this.ps = [];
  }

  clear() {
    // Clear regardless of any transforms
    const t = this.ctx.getTransform();
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.setTransform(t);
  }

  down(p) {
    this.last = p;
    this.ps = [];
  }
  move(ps) {
    if (this.dirty) {
      this.clear();
      this.stroke(this.ps);
    }
    let last = this.last;
    for (let p of ps) {
      this.ctx.beginPath();
      this.ctx.moveTo(last.x, last.y);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
      last = p;
      this.ps.push(p);
    }
    this.last = last;
  }
  prediction(ps) {
    this.dirty = true;
    let last = this.last;
    for (let p of ps) {
      this.ctx.beginPath();
      this.ctx.moveTo(last.x, last.y);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
      last = p;
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
    for (let i = 1; i < ps.length; i++) {
      this.ctx.lineTo(ps[i].x, ps[i].y);
    }
    this.ctx.stroke();
  }
}
