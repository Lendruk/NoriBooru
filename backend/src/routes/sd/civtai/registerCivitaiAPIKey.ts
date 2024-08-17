import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { Request } from '../../../types/Request';

const registerCivitaiAPIKey = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { key } = request.body as { key: string };

	if (key) {
		await vault.setCivitaiApiKey(key);
	}

	reply.send({ message: 'API key registered successfully' });
};

export default {
	method: 'POST',
	url: '/sd/civitai/register',
	handler: registerCivitaiAPIKey,
	onRequest: checkVault
} as RouteOptions;
