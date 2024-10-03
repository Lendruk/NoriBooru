import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const getWatcher = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };

	return reply.send({ ...vault.watchers.getWatcher(id) });
};

export default {
	method: 'GET',
	url: '/watchers/:id',
	handler: getWatcher,
	onRequest: checkVault
} as RouteOptions;
