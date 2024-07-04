import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import WildcardService, { SDWildcard } from '../../../services/WildcardService';
import { Request } from '../../../types/Request';

const getWildcards = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const wildcards: SDWildcard[] = await WildcardService.getWildcards(vaultInstance);
	return reply.send(wildcards);
};

export default {
	method: 'GET',
	url: '/sd/wildcards',
	handler: getWildcards,
	onRequest: checkVault
} as RouteOptions;
