import { Matrix, inverse } from "ml-matrix";

export class KalmanFilter {
  constructor(xDim, zDim) {
    // Dimension of state vector
    this.xDim = 4;
    // Dimensions of measurement vector
    this.zDim = 1;
    this.xDim = xDim;
    this.zDim = zDim;
    this.x = Matrix.zeros(xDim, 1); // TBD flip dimensions?
    this.P = Matrix.identity(xDim);
    this.Q = Matrix.identity(xDim);
    this.R = Matrix.identity(zDim);
    this.F = Matrix.zeros(xDim, xDim);
    this.H = Matrix.zeros(zDim, xDim);
    this.K = Matrix.zeros(xDim, zDim);
    this.z = Matrix.zeros(zDim, 1); // TBD flip dimensions?
    this.reset();
  }
  reset() {
    const { xDim, zDim } = this;
    this.x = Matrix.zeros(xDim, 1);
    this.P = Matrix.identity(xDim, xDim);
    this.K = Matrix.zeros(xDim, zDim);
  }
  predict() {
    const { F, Q } = this;
    let { x, P } = this;
    // x = F * x
    x = F.mmul(x);
    // P = F * P * F' + Q
    P = F.mmul(P).mmul(F.transpose()).add(Q);
    this.x = x;
    this.P = P;
  }
  update(z) {
    if (!(z instanceof Matrix)) {
      z = new Matrix(z);
    }
    this.z = z;
    const { H, R } = this;
    let { x, K, P } = this;
    // y = z - H * x
    const y = z.sub(H.mmul(x));
    // S = H * P * H' + R
    const S = H.mmul(P).mmul(H.transpose()).add(R);
    // K = P * H' * inv(S)
    K = P.mmul(H.transpose()).mmul(inverse(S));
    // x = x + K * y
    x = x.add(K.mmul(y));
    // // I_KH = identity(size(P)) - K * H
    // console.assert(P.rows === P.columns);
    // const I_KH = Matrix.identity(P.rows, P.rows).sub(K.mmul(H));
    // // P = I_KH * P * I_KH' + K * R * K'
    // P = I_KH.mmul(P).mmul(I_KH.transpose()).add(K.mmul(R).mmul(K.transpose()));
    // P = P - K * H * P
    P = P.sub(K.mmul(H).mmul(P));
    this.x = x;
    this.K = K;
    this.P = P;
  }
}
//# sourceMappingURL=KalmanFilter.js.map
