import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes';
import { VaultController } from './db/VaultController';
import { Request } from './types/Request';

const app = Fastify({
	logger: true
});

app.register(cors);

for (const route of routes) {
	app.register(async function (fastify) {
		fastify.route(route);
	});
}

app.addHook("onRequest", (req) => {
	const vaultHeader = req.headers['vault'];

	if(vaultHeader && typeof vaultHeader === 'string') {
		(req as Request)['vault'] = VaultController.getVault(vaultHeader);
	}
});

app.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
});

