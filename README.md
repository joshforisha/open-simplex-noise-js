# OpenSimplex Noise

[![build](https://img.shields.io/travis/joshforisha/open-simplex-noise-js.svg)](https://travis-ci.org/joshforisha/open-simplex-noise-js)
[![npm](https://img.shields.io/npm/v/open-simplex-noise.svg)](https://www.npmjs.com/package/open-simplex-noise)

TypeScript implementation of [OpenSimplex noise](https://en.wikipedia.org/wiki/OpenSimplex_noise)

## Install

    npm install open-simplex-noise

## Example

```javascript
import { makeNoise2D } from "open-simplex-noise";

const [width, height] = [888, 222];
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const imageData = ctx.createImageData(width, height);
const noise2D = makeNoise2D(Date.now());

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    const i = (x + y * width) * 4;
    const value = (noise2D(x, y) + 1) * 128;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }
}
ctx.putImageData(imageData, 0, 0);
```

![Example output](https://github.com/joshforisha/open-simplex-noise-js/blob/master/images/example.png?raw=true)

## API

```typescript
type Noise2D = (x: number, y: number) => number
type Noise3D = (x: number, y: number, z: number) => number
type Noise4D = (x: number, y: number, z: number, w: number) => number
```

#### `makeNoise2D (seed: number) => Noise2D`

Initializes and returns a function to generate 2D noise.

#### `makeNoise3D (seed: number) => Noise3D`

Initializes and returns a function to generate 3D noise.

#### `makeNoise4D (seed: number) => Noise4D`

Initializes and returns a function to generate 4D noise.
