import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../../hooks/checkVault';
import { SDWildcard } from '../../../../services/WildcardService';
import { VaultRequest } from '../../../../types/Request';

const getWildcards = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const wildcards: SDWildcard[] = await vault.wildcards.getWildcards();
	return reply.send(wildcards);
};

export default {
	method: 'GET',
	url: '/sd/wildcards',
	handler: getWildcards,
	onRequest: checkVault
} as RouteOptions;
