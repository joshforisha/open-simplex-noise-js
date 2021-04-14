# OpenSimplex Noise

TypeScript implementation of [OpenSimplex noise](https://en.wikipedia.org/wiki/OpenSimplex_noise).

* Deno module: [https://deno.land/x/open_simplex_noise](https://deno.land/x/open_simplex_noise)
* NPM package: [open-simplex-noise](https://www.npmjs.com/package/open-simplex-noise)

## Example

```javascript
import { makeNoise2D } from "open-simplex-noise";
// import { makeNoise2D } from "https://deno.land/x/open-simplex-noise/mod.ts"

const [width, height] = [888, 222];
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const imageData = ctx.createImageData(width, height);
const noise2D = makeNoise2D(Date.now()); // Using current date as seed

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

![Example output](https://raw.githubusercontent.com/joshforisha/open-simplex-noise-js/main/images/example.png)

## Fractal Noise

For _fractal noise_ results, which typically involves scaling frequencies and stacking octaves, see [joshforisha/fractal-noise-js](https://github.com/joshforisha/fractal-noise-js) (NPM: [fractal-noise](https://www.npmjs.com/package/fractal-noise)). The functions there can be used with this library's noise algorithm to obtain varied results like the following:

![Example fractal noise output](https://raw.githubusercontent.com/joshforisha/fractal-noise-js/main/images/rectangle-low-8.png)

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
