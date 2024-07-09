import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const stopSDUi = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.stopSDUi();

	reply.send();
};

export default {
	method: 'POST',
	url: '/sd/stop',
	handler: stopSDUi,
	onRequest: checkVault
} as RouteOptions;
