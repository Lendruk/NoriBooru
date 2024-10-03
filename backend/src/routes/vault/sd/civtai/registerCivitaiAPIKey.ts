import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const registerCivitaiAPIKey = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { key } = request.body as { key: string };

	if (key) {
		await vault.config.setCivitaiApiKey(key);
	}

	reply.send({ message: 'API key registered successfully' });
};

export default {
	method: 'POST',
	url: '/sd/civitai/register',
	handler: registerCivitaiAPIKey,
	onRequest: checkVault
} as RouteOptions;
