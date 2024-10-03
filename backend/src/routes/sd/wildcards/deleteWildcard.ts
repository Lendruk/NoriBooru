import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const deleteWildcard = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;
	const { id } = request.params as { id: string };
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.wildcards.deleteWildcard(id);
	return reply.send({ message: 'Wildcard deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/sd/wildcards/:id',
	handler: deleteWildcard,
	onRequest: checkVault
} as RouteOptions;
