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
} from "./constants";

export type Noise2D = (x: number, y: number) => number;

export type Noise3D = (x: number, y: number, z: number) => number;

export type Noise4D = (x: number, y: number, z: number, w: number) => number;

interface Contribution2D {
  dx: number;
  dy: number;
  next?: Contribution2D;
  xsb: number;
  ysb: number;
}

interface Contribution3D {
  dx: number;
  dy: number;
  dz: number;
  next?: Contribution3D;
  xsb: number;
  ysb: number;
  zsb: number;
}

interface Contribution4D {
  dx: number;
  dy: number;
  dz: number;
  dw: number;
  next?: Contribution4D;
  xsb: number;
  ysb: number;
  zsb: number;
  wsb: number;
}

function contribution2D(
  multiplier: number,
  xsb: number,
  ysb: number
): Contribution2D {
  return {
    dx: -xsb - multiplier * SQUISH_2D,
    dy: -ysb - multiplier * SQUISH_2D,
    xsb,
    ysb
  };
}

function contribution3D(
  multiplier: number,
  xsb: number,
  ysb: number,
  zsb: number
): Contribution3D {
  return {
    dx: -xsb - multiplier * SQUISH_3D,
    dy: -ysb - multiplier * SQUISH_3D,
    dz: -zsb - multiplier * SQUISH_3D,
    xsb,
    ysb,
    zsb
  };
}

function contribution4D(
  multiplier: number,
  xsb: number,
  ysb: number,
  zsb: number,
  wsb: number
): Contribution4D {
  return {
    dx: -xsb - multiplier * SQUISH_4D,
    dy: -ysb - multiplier * SQUISH_4D,
    dz: -zsb - multiplier * SQUISH_4D,
    dw: -wsb - multiplier * SQUISH_4D,
    xsb,
    ysb,
    zsb,
    wsb
  };
}

export function makeNoise2D(clientSeed: number): Noise2D {
  const contributions: Contribution2D[] = [];
  for (let i = 0; i < p2D.length; i += 4) {
    const baseSet = base2D[p2D[i]];
    let previous: Contribution2D = null;
    let current: Contribution2D = null;
    for (let k = 0; k < baseSet.length; k += 3) {
      current = contribution2D(baseSet[k], baseSet[k + 1], baseSet[k + 2]);
      if (previous === null) contributions[i / 4] = current;
      else previous.next = current;
      previous = current;
    }
    current.next = contribution2D(p2D[i + 1], p2D[i + 2], p2D[i + 3]);
  }
  const lookup: Contribution2D[] = [];
  for (let i = 0; i < lookupPairs2D.length; i += 2) {
    lookup[lookupPairs2D[i]] = contributions[lookupPairs2D[i + 1]];
  }

  const perm = new Uint8Array(256);
  const perm2D = new Uint8Array(256);
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
    perm[i] = source[r[0]];
    perm2D[i] = perm[i] & 0x0e;
    source[r[0]] = source[i];
  }

  return (x: number, y: number): number => {
    const stretchOffset = (x + y) * STRETCH_2D;

    const xs = x + stretchOffset;
    const ys = y + stretchOffset;

    const xsb = Math.floor(xs);
    const ysb = Math.floor(ys);

    const squishOffset = (xsb + ysb) * SQUISH_2D;

    const dx0 = x - (xsb + squishOffset);
    const dy0 = y - (ysb + squishOffset);

    const xins = xs - xsb;
    const yins = ys - ysb;

    const inSum = xins + yins;
    const hash =
      (xins - yins + 1) |
      (inSum << 1) |
      ((inSum + yins) << 2) |
      ((inSum + xins) << 4);

    let value = 0;

    for (let c = lookup[hash]; c !== undefined; c = c.next) {
      const dx = dx0 + c.dx;
      const dy = dy0 + c.dy;

      const attn = 2 - dx * dx - dy * dy;
      if (attn > 0) {
        const px = xsb + c.xsb;
        const py = ysb + c.ysb;

        const indexPartA = perm[px & 0xff];
        const index = perm2D[(indexPartA + py) & 0xff];

        const valuePart = gradients2D[index] * dx + gradients2D[index + 1] * dy;

        value += attn * attn * attn * attn * valuePart;
      }
    }

    return value * NORM_2D;
  };
}

export function makeNoise3D(clientSeed: number): Noise3D {
  const contributions: Contribution3D[] = [];
  for (let i = 0; i < p3D.length; i += 9) {
    const baseSet = base3D[p3D[i]];
    let previous: Contribution3D = null;
    let current: Contribution3D = null;
    for (let k = 0; k < baseSet.length; k += 4) {
      current = contribution3D(
        baseSet[k],
        baseSet[k + 1],
        baseSet[k + 2],
        baseSet[k + 3]
      );
      if (previous === null) contributions[i / 9] = current;
      else previous.next = current;
      previous = current;
    }
    current.next = contribution3D(
      p3D[i + 1],
      p3D[i + 2],
      p3D[i + 3],
      p3D[i + 4]
    );
    current.next.next = contribution3D(
      p3D[i + 5],
      p3D[i + 6],
      p3D[i + 7],
      p3D[i + 8]
    );
  }
  const lookup: Contribution3D[] = [];
  for (let i = 0; i < lookupPairs3D.length; i += 2) {
    lookup[lookupPairs3D[i]] = contributions[lookupPairs3D[i + 1]];
  }

  const perm = new Uint8Array(256);
  const perm3D = new Uint8Array(256);
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
    perm[i] = source[r[0]];
    perm3D[i] = (perm[i] % 24) * 3;
    source[r[0]] = source[i];
  }

  return (x: number, y: number, z: number): number => {
    const stretchOffset = (x + y + z) * STRETCH_3D;

    const xs = x + stretchOffset;
    const ys = y + stretchOffset;
    const zs = z + stretchOffset;

    const xsb = Math.floor(xs);
    const ysb = Math.floor(ys);
    const zsb = Math.floor(zs);

    const squishOffset = (xsb + ysb + zsb) * SQUISH_3D;

    const dx0 = x - (xsb + squishOffset);
    const dy0 = y - (ysb + squishOffset);
    const dz0 = z - (zsb + squishOffset);

    const xins = xs - xsb;
    const yins = ys - ysb;
    const zins = zs - zsb;

    const inSum = xins + yins + zins;
    const hash =
      (yins - zins + 1) |
      ((xins - yins + 1) << 1) |
      ((xins - zins + 1) << 2) |
      (inSum << 3) |
      ((inSum + zins) << 5) |
      ((inSum + yins) << 7) |
      ((inSum + xins) << 9);

    let value = 0;

    for (let c = lookup[hash]; c !== undefined; c = c.next) {
      const dx = dx0 + c.dx;
      const dy = dy0 + c.dy;
      const dz = dz0 + c.dz;

      const attn = 2 - dx * dx - dy * dy - dz * dz;
      if (attn > 0) {
        const px = xsb + c.xsb;
        const py = ysb + c.ysb;
        const pz = zsb + c.zsb;

        const indexPartA = perm[px & 0xff];
        const indexPartB = perm[(indexPartA + py) & 0xff];
        const index = perm3D[(indexPartB + pz) & 0xff];

        const valuePart =
          gradients3D[index] * dx +
          gradients3D[index + 1] * dy +
          gradients3D[index + 2] * dz;

        value += attn * attn * attn * attn * valuePart;
      }
    }
    return value * NORM_3D;
  };
}

export function makeNoise4D(clientSeed: number): Noise4D {
  const contributions: Contribution4D[] = [];
  for (let i = 0; i < p4D.length; i += 16) {
    const baseSet = base4D[p4D[i]];
    let previous: Contribution4D = null;
    let current: Contribution4D = null;
    for (let k = 0; k < baseSet.length; k += 5) {
      current = contribution4D(
        baseSet[k],
        baseSet[k + 1],
        baseSet[k + 2],
        baseSet[k + 3],
        baseSet[k + 4]
      );
      if (previous === null) contributions[i / 16] = current;
      else previous.next = current;
      previous = current;
    }
    current.next = contribution4D(
      p4D[i + 1],
      p4D[i + 2],
      p4D[i + 3],
      p4D[i + 4],
      p4D[i + 5]
    );
    current.next.next = contribution4D(
      p4D[i + 6],
      p4D[i + 7],
      p4D[i + 8],
      p4D[i + 9],
      p4D[i + 10]
    );
    current.next.next.next = contribution4D(
      p4D[i + 11],
      p4D[i + 12],
      p4D[i + 13],
      p4D[i + 14],
      p4D[i + 15]
    );
  }
  const lookup: Contribution4D[] = [];
  for (let i = 0; i < lookupPairs4D.length; i += 2) {
    lookup[lookupPairs4D[i]] = contributions[lookupPairs4D[i + 1]];
  }

  const perm = new Uint8Array(256);
  const perm4D = new Uint8Array(256);
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
    perm[i] = source[r[0]];
    perm4D[i] = perm[i] & 0xfc;
    source[r[0]] = source[i];
  }

  return (x: number, y: number, z: number, w: number): number => {
    const stretchOffset = (x + y + z + w) * STRETCH_4D;

    const xs = x + stretchOffset;
    const ys = y + stretchOffset;
    const zs = z + stretchOffset;
    const ws = w + stretchOffset;

    const xsb = Math.floor(xs);
    const ysb = Math.floor(ys);
    const zsb = Math.floor(zs);
    const wsb = Math.floor(ws);

    const squishOffset = (xsb + ysb + zsb + wsb) * SQUISH_4D;
    const dx0 = x - (xsb + squishOffset);
    const dy0 = y - (ysb + squishOffset);
    const dz0 = z - (zsb + squishOffset);
    const dw0 = w - (wsb + squishOffset);

    const xins = xs - xsb;
    const yins = ys - ysb;
    const zins = zs - zsb;
    const wins = ws - wsb;

    const inSum = xins + yins + zins + wins;
    const hash =
      (zins - wins + 1) |
      ((yins - zins + 1) << 1) |
      ((yins - wins + 1) << 2) |
      ((xins - yins + 1) << 3) |
      ((xins - zins + 1) << 4) |
      ((xins - wins + 1) << 5) |
      (inSum << 6) |
      ((inSum + wins) << 8) |
      ((inSum + zins) << 11) |
      ((inSum + yins) << 14) |
      ((inSum + xins) << 17);

    let value = 0;

    for (let c = lookup[hash]; c !== undefined; c = c.next) {
      const dx = dx0 + c.dx;
      const dy = dy0 + c.dy;
      const dz = dz0 + c.dz;
      const dw = dw0 + c.dw;

      const attn = 2 - dx * dx - dy * dy - dz * dz - dw * dw;
      if (attn > 0) {
        const px = xsb + c.xsb;
        const py = ysb + c.ysb;
        const pz = zsb + c.zsb;
        const pw = wsb + c.wsb;

        const indexPartA = perm[px & 0xff];
        const indexPartB = perm[(indexPartA + py) & 0xff];
        const indexPartC = perm[(indexPartB + pz) & 0xff];
        const index = perm4D[(indexPartC + pw) & 0xff];

        const valuePart =
          gradients4D[index] * dx +
          gradients4D[index + 1] * dy +
          gradients4D[index + 2] * dz +
          gradients4D[index + 3] * dw;

        value += attn * attn * attn * attn * valuePart;
      }
    }
    return value * NORM_4D;
  };
}

function shuffleSeed(seed: Uint32Array): Uint32Array {
  const newSeed = new Uint32Array(1);
  newSeed[0] = seed[0] * 1664525 + 1013904223;
  return newSeed;
}
