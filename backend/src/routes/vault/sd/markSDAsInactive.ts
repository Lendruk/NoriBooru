import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const markSDAsInactive = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.stableDiffusion.markProcessAsInactive();

	reply.status(200).send({ message: 'Instance marked as inactive' });
};

export default {
	method: 'POST',
	url: '/sd/inactive',
	handler: markSDAsInactive,
	onRequest: checkVault
} as RouteOptions;