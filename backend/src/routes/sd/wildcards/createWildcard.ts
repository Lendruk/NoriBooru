import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

type RequestBody = {
	name: string;
	values: string[];
};

const createWildcard = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const body = request.body as RequestBody;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const updatedWildcard = await vault.wildcards.createWildcard(body.name, body.values);
	return reply.send(updatedWildcard);
};

export default {
	method: 'POST',
	url: '/sd/wildcards',
	handler: createWildcard,
	onRequest: checkVault
} as RouteOptions;
