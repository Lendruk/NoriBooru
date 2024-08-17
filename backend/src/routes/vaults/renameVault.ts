import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const renameVault = async (request: Request, reply: FastifyReply) => {
	const body = request.body as { name: string };
	const { vault } = request;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.setName(body.name);

	return reply.send(vault.getConfig());
};

export default {
	method: 'PUT',
	url: '/vaults',
	onRequest: checkVault,
	handler: renameVault
} as RouteOptions;
