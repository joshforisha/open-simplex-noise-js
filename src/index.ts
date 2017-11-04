import {
  NORM_2D,
  NORM_3D,
  NORM_4D,
  SQUISH_2D,
  SQUISH_3D,
  SQUISH_4D,
  STRETCH_2D,
  STRETCH_3D,
  STRETCH_4D,
  base2D,
  base3D,
  base4D,
  gradients2D,
  gradients3D,
  gradients4D,
  lookupPairs2D,
  lookupPairs3D,
  lookupPairs4D,
  p2D,
  p3D,
  p4D
} from './constants';

class Contribution2 {
  dx: number;
  dy: number;
  next: Contribution2;
  xsb: number;
  ysb: number;

  constructor(multiplier: number, xsb: number, ysb: number) {
    this.dx = -xsb - multiplier * SQUISH_2D;
    this.dy = -ysb - multiplier * SQUISH_2D;
    this.xsb = xsb;
    this.ysb = ysb;
  }
}

class Contribution3 {
  dx: number;
  dy: number;
  dz: number;
  next: Contribution3;
  xsb: number;
  ysb: number;
  zsb: number;

  constructor(multiplier: number, xsb: number, ysb: number, zsb: number) {
    this.dx = -xsb - multiplier * SQUISH_3D;
    this.dy = -ysb - multiplier * SQUISH_3D;
    this.dz = -zsb - multiplier * SQUISH_3D;
    this.xsb = xsb;
    this.ysb = ysb;
    this.zsb = zsb;
  }
}

class Contribution4 {
  dw: number;
  dx: number;
  dy: number;
  dz: number;
  next: Contribution4;
  wsb: number;
  xsb: number;
  ysb: number;
  zsb: number;

  constructor(
    multiplier: number,
    xsb: number,
    ysb: number,
    zsb: number,
    wsb: number
  ) {
    this.dx = -xsb - multiplier * SQUISH_4D;
    this.dy = -ysb - multiplier * SQUISH_4D;
    this.dz = -zsb - multiplier * SQUISH_4D;
    this.dw = -wsb - multiplier * SQUISH_4D;
    this.xsb = xsb;
    this.ysb = ysb;
    this.zsb = zsb;
    this.wsb = wsb;
  }
}

function shuffleSeed(seed: Uint32Array): Uint32Array {
  const newSeed = new Uint32Array(1);
  newSeed[0] = seed[0] * 1664525 + 1013904223;
  return newSeed;
}

export default class OpenSimplexNoise {
  private lookup2D: Contribution2[];
  private lookup3D: Contribution3[];
  private lookup4D: Contribution4[];
  private perm: Uint8Array;
  private perm2D: Uint8Array;
  private perm3D: Uint8Array;
  private perm4D: Uint8Array;

  constructor(clientSeed: number) {
    this.initialize();
    this.perm = new Uint8Array(256);
    this.perm2D = new Uint8Array(256);
    this.perm3D = new Uint8Array(256);
    this.perm4D = new Uint8Array(256);
    const source = new Uint8Array(256);
    for (let i = 0; i < 256; i++) source[i] = i;
    let seed = new Uint32Array(1);
    seed[0] = clientSeed;
    seed = shuffleSeed(shuffleSeed(shuffleSeed(seed)));
    for (let i = 255; i >= 0; i--) {
      seed = shuffleSeed(seed);
      const r = new Uint32Array(1);
      r[0] = (seed[0] + 31) % (i + 1);
      if (r[0] < 0) r[0] += i + 1;
      this.perm[i] = source[r[0]];
      this.perm2D[i] = this.perm[i] & 0x0e;
      this.perm3D[i] = (this.perm[i] % 24) * 3;
      this.perm4D[i] = this.perm[i] & 0xfc;
      source[r[0]] = source[i];
    }
  }

  noise2D(x: number, y: number): number {
    const stretchOffset = (x + y) * STRETCH_2D;
    const [xs, ys] = [x + stretchOffset, y + stretchOffset];
    const [xsb, ysb] = [Math.floor(xs), Math.floor(ys)];
    const squishOffset = (xsb + ysb) * SQUISH_2D;
    const [dx0, dy0] = [x - (xsb + squishOffset), y - (ysb + squishOffset)];
    const [xins, yins] = [xs - xsb, ys - ysb];
    const inSum = xins + yins;
    const hashVals = new Uint32Array(4);
    hashVals[0] = xins - yins + 1;
    hashVals[1] = inSum;
    hashVals[2] = inSum + yins;
    hashVals[3] = inSum + xins;
    const hash =
      hashVals[0] |
      (hashVals[1] << 1) |
      (hashVals[2] << 2) |
      (hashVals[3] << 4);
    let c = this.lookup2D[hash];
    let value = 0.0;
    while (typeof c !== 'undefined') {
      const [dx, dy] = [dx0 + c.dx, dy0 + c.dy];
      let attn = 2 - dx * dx - dy * dy;
      if (attn > 0) {
        const [px, py] = [xsb + c.xsb, ysb + c.ysb];
        const i = this.perm2D[(this.perm[px & 0xff] + py) & 0xff];
        const valuePart = gradients2D[i] * dx + gradients2D[i + 1] * dy;
        attn *= attn;
        value += attn * attn * valuePart;
      }
      c = c.next;
    }
    return value * NORM_2D;
  }

  noise3D(x: number, y: number, z: number): number {
    const stretchOffset = (x + y + z) * STRETCH_3D;
    const [xs, ys, zs] = [
      x + stretchOffset,
      y + stretchOffset,
      z + stretchOffset
    ];
    const [xsb, ysb, zsb] = [Math.floor(xs), Math.floor(ys), Math.floor(zs)];
    const squishOffset = (xsb + ysb + zsb) * SQUISH_3D;
    const [dx0, dy0, dz0] = [
      x - (xsb + squishOffset),
      y - (ysb + squishOffset),
      z - (zsb + squishOffset)
    ];
    const [xins, yins, zins] = [xs - xsb, ys - ysb, zs - zsb];
    const inSum = xins + yins + zins;
    const hashVals = new Uint32Array(7);
    hashVals[0] = yins - zins + 1;
    hashVals[1] = xins - yins + 1;
    hashVals[2] = xins - zins + 1;
    hashVals[3] = inSum;
    hashVals[4] = inSum + zins;
    hashVals[5] = inSum + yins;
    hashVals[6] = inSum + xins;
    const hash =
      hashVals[0] |
      (hashVals[1] << 1) |
      (hashVals[2] << 2) |
      (hashVals[3] << 3) |
      (hashVals[4] << 5) |
      (hashVals[5] << 7) |
      (hashVals[6] << 9);
    let c = this.lookup3D[hash];
    let value = 0.0;
    while (typeof c !== 'undefined') {
      const [dx, dy, dz] = [dx0 + c.dx, dy0 + c.dy, dz0 + c.dz];
      let attn = 2 - dx * dx - dy * dy - dz * dz;
      if (attn > 0) {
        const [px, py, pz] = [xsb + c.xsb, ysb + c.ysb, zsb + c.zsb];
        const i = this.perm3D[
          (this.perm[(this.perm[px & 0xff] + py) & 0xff] + pz) & 0xff
        ];
        const valuePart =
          gradients3D[i] * dx +
          gradients3D[i + 1] * dy +
          gradients3D[i + 2] * dz;
        attn *= attn;
        value += attn * attn * valuePart;
      }
      c = c.next;
    }
    return value * NORM_3D;
  }

  noise4D(x: number, y: number, z: number, w: number): number {
    const stretchOffset = (x + y + z + w) * STRETCH_4D;
    const [xs, ys, zs, ws] = [
      x + stretchOffset,
      y + stretchOffset,
      z + stretchOffset,
      w + stretchOffset
    ];
    const [xsb, ysb, zsb, wsb] = [
      Math.floor(xs),
      Math.floor(ys),
      Math.floor(zs),
      Math.floor(ws)
    ];
    const squishOffset = (xsb + ysb + zsb + wsb) * SQUISH_4D;
    const dx0 = x - (xsb + squishOffset);
    const dy0 = y - (ysb + squishOffset);
    const dz0 = z - (zsb + squishOffset);
    const dw0 = w - (wsb + squishOffset);
    const [xins, yins, zins, wins] = [xs - xsb, ys - ysb, zs - zsb, ws - wsb];
    const inSum = xins + yins + zins + wins;
    const hashVals = new Uint32Array(11);
    hashVals[0] = zins - wins + 1;
    hashVals[1] = yins - zins + 1;
    hashVals[2] = yins - wins + 1;
    hashVals[3] = xins - yins + 1;
    hashVals[4] = xins - zins + 1;
    hashVals[5] = xins - wins + 1;
    hashVals[6] = inSum;
    hashVals[7] = inSum + wins;
    hashVals[8] = inSum + zins;
    hashVals[9] = inSum + yins;
    hashVals[10] = inSum + xins;
    const hash =
      hashVals[0] |
      (hashVals[1] << 1) |
      (hashVals[2] << 2) |
      (hashVals[3] << 3) |
      (hashVals[4] << 4) |
      (hashVals[5] << 5) |
      (hashVals[6] << 6) |
      (hashVals[7] << 8) |
      (hashVals[8] << 11) |
      (hashVals[9] << 14) |
      (hashVals[10] << 17);
    let c = this.lookup4D[hash];
    let value = 0.0;
    while (typeof c !== 'undefined') {
      const [dx, dy, dz, dw] = [dx0 + c.dx, dy0 + c.dy, dz0 + c.dz, dw0 + c.dw];
      let attn = 2 - dx * dx - dy * dy - dz * dz - dw * dw;
      if (attn > 0) {
        const [px, py, pz, pw] = [
          xsb + c.xsb,
          ysb + c.ysb,
          zsb + c.zsb,
          wsb + c.wsb
        ];
        const i = this.perm4D[
          (this.perm[
            (this.perm[(this.perm[px & 0xff] + py) & 0xff] + pz) & 0xff
          ] +
            pw) &
            0xff
        ];
        const valuePart =
          gradients4D[i] * dx +
          gradients4D[i + 1] * dy +
          gradients4D[i + 2] * dz +
          gradients4D[i + 3] * dw;
        attn *= attn;
        value += attn * attn * valuePart;
      }
      c = c.next;
    }
    return value * NORM_4D;
  }

  private initialize() {
    const contributions2D: Contribution2[] = [];
    for (let i = 0; i < p2D.length; i += 4) {
      const baseSet = base2D[p2D[i]];
      let previous: Contribution2 = null;
      let current: Contribution2 = null;
      for (let k = 0; k < baseSet.length; k += 3) {
        current = new Contribution2(baseSet[k], baseSet[k + 1], baseSet[k + 2]);
        if (previous === null) contributions2D[i / 4] = current;
        else previous.next = current;
        previous = current;
      }
      current.next = new Contribution2(p2D[i + 1], p2D[i + 2], p2D[i + 3]);
    }
    this.lookup2D = [];
    for (let i = 0; i < lookupPairs2D.length; i += 2) {
      this.lookup2D[lookupPairs2D[i]] = contributions2D[lookupPairs2D[i + 1]];
    }

    const contributions3D: Contribution3[] = [];
    for (let i = 0; i < p3D.length; i += 9) {
      const baseSet = base3D[p3D[i]];
      let previous: Contribution3 = null;
      let current: Contribution3 = null;
      for (let k = 0; k < baseSet.length; k += 4) {
        current = new Contribution3(
          baseSet[k],
          baseSet[k + 1],
          baseSet[k + 2],
          baseSet[k + 3]
        );
        if (previous === null) contributions3D[i / 9] = current;
        else previous.next = current;
        previous = current;
      }
      current.next = new Contribution3(
        p3D[i + 1],
        p3D[i + 2],
        p3D[i + 3],
        p3D[i + 4]
      );
      current.next.next = new Contribution3(
        p3D[i + 5],
        p3D[i + 6],
        p3D[i + 7],
        p3D[i + 8]
      );
    }
    this.lookup3D = [];
    for (let i = 0; i < lookupPairs3D.length; i += 2) {
      this.lookup3D[lookupPairs3D[i]] = contributions3D[lookupPairs3D[i + 1]];
    }

    const contributions4D: Contribution4[] = [];
    for (let i = 0; i < p4D.length; i += 16) {
      const baseSet = base4D[p4D[i]];
      let previous: Contribution4 = null;
      let current: Contribution4 = null;
      for (let k = 0; k < baseSet.length; k += 5) {
        current = new Contribution4(
          baseSet[k],
          baseSet[k + 1],
          baseSet[k + 2],
          baseSet[k + 3],
          baseSet[k + 4]
        );
        if (previous === null) contributions4D[i / 16] = current;
        else previous.next = current;
        previous = current;
      }
      current.next = new Contribution4(
        p4D[i + 1],
        p4D[i + 2],
        p4D[i + 3],
        p4D[i + 4],
        p4D[i + 5]
      );
      current.next.next = new Contribution4(
        p4D[i + 6],
        p4D[i + 7],
        p4D[i + 8],
        p4D[i + 9],
        p4D[i + 10]
      );
      current.next.next.next = new Contribution4(
        p4D[i + 11],
        p4D[i + 12],
        p4D[i + 13],
        p4D[i + 14],
        p4D[i + 15]
      );
    }
    this.lookup4D = [];
    for (let i = 0; i < lookupPairs4D.length; i += 2) {
      this.lookup4D[lookupPairs4D[i]] = contributions4D[lookupPairs4D[i + 1]];
    }
  }
}
