import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import ws from '@fastify/websocket';
import Fastify from 'fastify';
import fs from 'fs/promises';
import 'reflect-metadata';
import { checkVault } from './hooks/checkVault';
import { VaultMigrator } from './lib/VaultMigrator';
import routes from './routes';
import { VaultRequest } from './types/Request';
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
	// Temporary fix until routes are converted to the new router abstraction
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	app.route(route as any);
}

app.setNotFoundHandler(async (request, reply) => {
	await checkVault(request, reply);

	const castRequest = request as VaultRequest;
	if (castRequest.vault) {
		return reply.status(308).send({
			message: 'Not Found, use the api with the vault port',
			port: castRequest.vault.getPort()
		});
	}

	return reply.status(404).send({ message: 'Not Found' });
});

app.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
});
