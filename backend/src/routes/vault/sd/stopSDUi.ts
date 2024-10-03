import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const stopSDUi = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.stableDiffusion.stopSDUi();

	reply.send({ message: 'SDUi stopped successfully' });
};

export default {
	method: 'POST',
	url: '/sd/stop',
	handler: stopSDUi,
	onRequest: checkVault
} as RouteOptions;
