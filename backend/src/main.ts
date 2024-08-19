import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import ws from '@fastify/websocket';
import Fastify from 'fastify';
import fs from 'fs/promises';
import { VaultMigrator } from './lib/VaultMigrator';
import routes from './routes';
import { getServerConfig } from './utils/getServerConfig';

(async () => {
	// Check if the base vault dir exists
	const baseVaultDir = (await getServerConfig()).baseVaultDir;
	try {
		await fs.stat(baseVaultDir);
	} catch {
		console.log(`Base vault dir ${baseVaultDir} does not exist, creating it`);
		await fs.mkdir(baseVaultDir);
	}

	await VaultMigrator.init();
})();

const app = Fastify({
	logger: true,
	bodyLimit: 100000000 // ~100mb
});

app.register(ws);
app.register(cors);
app.register(multipart, {
	limits: {
		files: 100000,
		fileSize: 107374182400
	}
});

for (const route of routes) {
	app.register(async function (fastify) {
		fastify.route(route);
	});
}

app.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
});
