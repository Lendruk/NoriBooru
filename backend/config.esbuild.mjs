import * as esbuild from 'esbuild';
import fs from 'fs/promises';

await esbuild.build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	platform: 'node',
	target: 'node20',
	outfile: 'dist/main.mjs',
	format: 'esm',
	packages: 'bundle',
	external: ['fluent-ffmpeg', 'better-sqlite3'],
	banner: {
		js: `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const __dirname = import.meta.url;
      const __filename = import.meta.url;
    `
	}
});

await Promise.all([
	fs.cp('node_modules/fluent-ffmpeg', 'dist/node_modules/fluent-ffmpeg', { recursive: true }),
	fs.cp('node_modules/better-sqlite3', 'dist/node_modules/better-sqlite3', { recursive: true }),
	fs.cp('migrations', 'dist/migrations', { recursive: true }),
]);