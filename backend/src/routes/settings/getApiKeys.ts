import { FastifyReply } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';
const getApiKeys = async (request: Request, reply: FastifyReply) => {
	const { vault } = request;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	return reply.send({
		civitaiApiKey: vault.config.civitaiApiKey
	});
};

export default {
	method: 'GET',
	url: '/settings/api-keys',
	handler: getApiKeys,
	onRequest: checkVault
};
