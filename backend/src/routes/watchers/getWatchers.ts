import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getWatchers = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	return reply.send({
		watchers: vault.watchers.getWatchers().sort((a, b) => b.createdAt - a.createdAt)
	});
};

export default {
	method: 'GET',
	url: '/watchers',
	handler: getWatchers,
	onRequest: checkVault
} as RouteOptions;
