import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../../hooks/checkVault';
import { VaultRequest } from '../../../../types/Request';

type RequestBody = {
	name?: string;
	values?: string[];
};

const updateWildcard = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;
	const { id } = request.params as { id: string };
	const body = request.body as RequestBody;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const updatedWildcard = await vault.wildcards.updateWildcard(id, body);
	return reply.send(updatedWildcard);
};

export default {
	method: 'PUT',
	url: '/sd/wildcards/:id',
	handler: updateWildcard,
	onRequest: checkVault
} as RouteOptions;
