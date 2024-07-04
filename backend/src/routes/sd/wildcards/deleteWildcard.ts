import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import WildcardService from '../../../services/WildcardService';
import { Request } from '../../../types/Request';

const deleteWildcard = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const { id } = request.params as { id: string };
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	await WildcardService.deleteWildcard(vaultInstance, id);
	return reply.send({ message: 'Wildcard deleted successfully'});
};

export default {
	method: 'DELETE',
	url: '/sd/wildcards/:id',
	handler: deleteWildcard,
	onRequest: checkVault
} as RouteOptions;
