import { PenKalmanFilter } from "./PenKalmanFilter.js";

const VELOCITY_INFLUENCE = 1.0;
const ACCELERATION_INFLUENCE = 0.5;
const JANK_INFLUENCE = 0.1;
const LOW_JANK = 0.02;
const HIGH_JANK = 0.2;
const LOW_SPEED = 0;
const HIGH_SPEED = 1.2;

export class Predictor {
  constructor(predictionTargetMs = 25) {
    this.kalman = new PenKalmanFilter(0.01, 1.0);
    this.kalman.reset();
    this.reportRateMs = 1000 / 400;
    this.predictionTargetMs = predictionTargetMs;
    this.prevEventTime = 0;
    this.reportRates = [];
    this.lastPoint = { x: 0, y: 0, pressure: 0 };
  }
  initStrokePrediction() {
    this.kalman.reset();
  }
  update(x, y, pressure, eventTime) {
    this.kalman.update(x, y, pressure);
    this.lastPoint = { x, y, pressure };
    if (this.reportRates.length < 20) {
      if (this.prevEventTime > 0) {
        const dt = eventTime - this.prevEventTime;
        this.reportRates.push(dt);
        let sum = 0;
        this.reportRates.forEach((dt) => {
          sum += dt;
        });
        this.reportRateMs = Math.max(sum / this.reportRates.length, 1); // Min of 1ms report rate to prevent 0
      }
    }
    this.prevEventTime = eventTime;
  }
  predict() {
    if (this.kalman.numIterations < 4) {
      return [];
    }
    const position = this.lastPoint;
    const velocity = this.kalman.velocity;
    const acceleration = this.kalman.acceleration;
    const jank = this.kalman.jank;
    const pressureChange = this.kalman.pressureChange;
    const speedAbs = normalize(velocity) / this.reportRateMs;
    const speedFactor = normalizeRange(speedAbs, LOW_SPEED, HIGH_SPEED);
    const jankAbs = normalize(jank);
    const jankFactor = 1 - normalizeRange(jankAbs, LOW_JANK, HIGH_JANK);
    const confidenceFactor = speedFactor * jankFactor;
    const predictionTargetInSamples = Math.ceil(
      (this.predictionTargetMs / this.reportRateMs) * confidenceFactor
    );
    const prediction = [];
    for (let i = 0; i < predictionTargetInSamples; i++) {
      acceleration.x += jank.x * JANK_INFLUENCE;
      acceleration.y += jank.y * JANK_INFLUENCE;
      velocity.x += acceleration.x * ACCELERATION_INFLUENCE;
      velocity.y += acceleration.y * ACCELERATION_INFLUENCE;
      position.x += velocity.x * VELOCITY_INFLUENCE;
      position.y += velocity.y * VELOCITY_INFLUENCE;
      position.pressure += pressureChange;
      if (position.pressure < 0.1) {
        break;
      }
      prediction.push({
        ...position,
      });
    }
    return prediction;
  }
}
function normalize(p) {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}
function normalizeRange(x, min, max) {
  const normalized = (x - min) / (max - min);
  return Math.min(1.0, Math.max(normalized, 0));
}
