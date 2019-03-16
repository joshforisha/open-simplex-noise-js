import typescript from 'rollup-plugin-typescript';
import pkg from './package.json';

export default [
	// browser-friendly IIFE build
	{
		input: 'src/index.ts',
		output: {
			name: 'OpenSimplexNoise',
			file: pkg.main,
			format: 'iife'
		},
		plugins: [
			typescript() // so Rollup can convert TypeScript to JavaScript
		]
	},

	// ES module build.
	{
        input: 'src/index.ts',
        output: {
            file: pkg.module,
            format: 'es'
        },
		plugins: [
			typescript() // so Rollup can convert TypeScript to JavaScript
		],
	}
];