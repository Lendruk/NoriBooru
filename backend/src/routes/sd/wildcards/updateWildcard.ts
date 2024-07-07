import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import WildcardService from '../../../services/WildcardService';
import { Request } from '../../../types/Request';

type RequestBody = {
  name?: string;
  values?: string[]
}

const updateWildcard = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const { id } = request.params as { id: string };
	const body = request.body as RequestBody;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const updatedWildcard = await WildcardService.updateWildcard(vaultInstance, id, body);
	return reply.send(updatedWildcard);
};

export default {
	method: 'PUT',
	url: '/sd/wildcards/:id',
	handler: updateWildcard,
	onRequest: checkVault
} as RouteOptions;
