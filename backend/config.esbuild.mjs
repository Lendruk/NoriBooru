import { execSync } from 'child_process';
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
const nodeModules = new RegExp(/^(?:.*[\\/])?node_modules(?:[\\/].*)?$/);

const dirnamePlugin = {
	name: 'dirname',

	setup(build) {
		build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
			if (!filePath.match(nodeModules)) {
				let contents = readFileSync(filePath, 'utf8');
				const loader = path.extname(filePath).substring(1);
				const dirname = path.dirname(filePath);
				contents = contents
					.replace('__dirname', `"${dirname}"`)
					.replace('__filename', `"${filePath}"`);
				return {
					contents,
					loader,
				};
			}
		});
	},
};

await esbuild.build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	platform: 'node',
	target: 'node20',
	outfile: 'dist/main.mjs',
	format: 'esm',
	packages: 'bundle',
	external: ['fluent-ffmpeg', 'better-sqlite3', 'sharp'],
	plugins: [dirnamePlugin],
	banner: {
		js: `
		
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const __dirname = import.meta.url;
      const __filename = import.meta.url;
    `
	}
});

execSync('cd dist && npm init -y && npm install sharp better-sqlite3 fluent-ffmpeg');

await Promise.all([
	// fs.cp('node_modules/fluent-ffmpeg', 'dist/node_modules/fluent-ffmpeg', { recursive: true }),
	// fs.cp('node_modules/isexe', 'dist/node_modules/isexe', { recursive: true }),
	// fs.cp('node_modules/async', 'dist/node_modules/async', { recursive: true }),
	// fs.cp('node_modules/sharp', 'dist/node_modules/sharp', { recursive: true }),
	// fs.cp('node_modules/color', 'dist/node_modules/color', { recursive: true }),
	// fs.cp('node_modules/detect-libc', 'dist/node_modules/detect-libc', { recursive: true }),
	// fs.cp('node_modules/semver', 'dist/node_modules/semver', { recursive: true }),
	// fs.cp('node_modules/better-sqlite3/build/Release/better_sqlite3.node', 'dist/build/better_sqlite3.node', { recursive: true }),
	fs.cp('migrations', 'dist/migrations', { recursive: true }),
]);