# OpenSimplex Noise

[![build](https://img.shields.io/travis/joshforisha/open-simplex-noise-js.svg)](https://travis-ci.org/joshforisha/open-simplex-noise-js)
[![npm](https://img.shields.io/npm/v/open-simplex-noise.svg)](https://www.npmjs.com/package/open-simplex-noise)

TypeScript/JavaScript implementation of [OpenSimplex noise](https://en.wikipedia.org/wiki/OpenSimplex_noise)

## Install

    npm install open-simplex-noise

## Example

```javascript
import OpenSimplexNoise from 'open-simplex-noise';

const [width, height] = [888, 222];
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(width, height);
const openSimplex = new OpenSimplexNoise(Date.now());

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    const i = (x + y * width) * 4;
    const value = (openSimplex.noise2D(x, y) + 1) * 128;
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

### `class OpenSimplexNoise`

#### `constructor (seed: number)`

#### `noise2D (x: number, y: number) => number`

#### `noise3D (x: number, y: number, z: number) => number`

#### `noise4D (x: number, y: number, z: number, w: number) => number`
