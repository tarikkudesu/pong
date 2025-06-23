import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['index.js'],
	outfile: 'dist/server.js',
	packages: 'external',
	sourcemap: true, // ! remove in production
	platform: 'node',
	format: 'esm',
	bundle: true,
	minify: true,
});
