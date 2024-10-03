import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const renameVault = async (request: VaultRequest, reply: FastifyReply) => {
	const body = request.body as { name: string };
	const { vault } = request;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.config.setName(body.name);

	return reply.send(vault.config.getConfig());
};

export default {
	method: 'PUT',
	url: '/vaults',
	onRequest: checkVault,
	handler: renameVault
} as RouteOptions;
