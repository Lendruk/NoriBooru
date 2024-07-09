import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const startSDUi = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	await vault.startSDUi();

	reply.send({ message: 'SDUi has been started successfully!' });
};

export default {
	method: 'POST',
	url: '/sd/start',
	handler: startSDUi,
	onRequest: checkVault
} as RouteOptions;
