import { Matrix } from "ml-matrix";
import { KalmanFilter } from "./KalmanFilter.js";

export class PenKalmanFilter {
  constructor(sigmaProcess, sigmaMeasurement) {
    this.sigmaProcess = sigmaProcess;
    this.sigmaMeasurement = sigmaMeasurement;
    this.xKalman = this.createAxisKalmanFilter();
    this.yKalman = this.createAxisKalmanFilter();
    this.pressureKalman = this.createAxisKalmanFilter();
    this.numIterations = 0;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.jank = { x: 0, y: 0 };
    this.pressure = 0;
    this.pressureChange = 0;
  }
  reset() {
    this.xKalman.reset();
    this.yKalman.reset();
    this.pressureKalman.reset();
    this.numIterations = 0;
  }
  update(x, y, pressure) {
    if (this.numIterations == 0) {
      this.xKalman.x.set(0, 0, x);
      this.yKalman.x.set(0, 0, y);
      this.pressureKalman.x.set(0, 0, pressure);
    } else {
      this.xKalman.predict();
      this.xKalman.update([[x]]);
      this.yKalman.predict();
      this.yKalman.update([[y]]);
      this.pressureKalman.predict();
      this.pressureKalman.update([[pressure]]);
    }
    this.numIterations += 1;
    this.position.x = this.xKalman.x.get(0, 0); // ml-matrix is rows,columns
    this.position.y = this.yKalman.x.get(0, 0);
    this.velocity.x = this.xKalman.x.get(1, 0);
    this.velocity.y = this.yKalman.x.get(1, 0);
    this.acceleration.x = this.xKalman.x.get(2, 0);
    this.acceleration.y = this.yKalman.x.get(2, 0);
    this.jank.x = this.xKalman.x.get(3, 0);
    this.jank.y = this.yKalman.x.get(3, 0);
    this.pressure = this.pressureKalman.x.get(0, 0);
    this.pressureChange = this.pressureKalman.x.get(1, 0);
  }
  createAxisKalmanFilter() {
    const dt = 1.0;
    const kalman = new KalmanFilter(4, 1);
    // State transition matrix is derived from basic physics
    kalman.F = new Matrix([
      [1.0, dt, 0.5 * dt * dt, 0.16 * dt * dt * dt],
      [0, 1.0, dt, 0.5 * dt * dt],
      [0, 0, 1.0, dt],
      [0, 0, 0, 1.0],
    ]);
    // We model the system noise as a noisy force on the pen.
    const G = new Matrix([[0.16 * dt * dt * dt], [0.5 * dt * dt], [dt], [1]]);
    kalman.Q = G.mmul(G.transpose());
    kalman.Q = kalman.Q.mul(this.sigmaProcess); //multiply(kalman.Q, this.sigmaProcess) as Matrix;
    // Measurements only impact the location
    kalman.H = new Matrix([[1.0, 0.0, 0.0, 0.0]]);
    // Measurement noise is a 1-D normal distribution
    kalman.R.set(0, 0, this.sigmaMeasurement);
    return kalman;
  }
}
//# sourceMappingURL=PenKalmanFilter.js.map
