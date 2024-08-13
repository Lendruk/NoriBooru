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
	fs.cp('migrations', 'dist/migrations', { recursive: true }),
]);