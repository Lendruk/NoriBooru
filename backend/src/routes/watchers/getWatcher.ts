import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getWatcher = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };

	return reply.send({ ...vault.getWatcher(id) });
};

export default {
	method: 'GET',
	url: '/watchers/:id',
	handler: getWatcher,
	onRequest: checkVault
} as RouteOptions;
