import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const refreshCheckpoints = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	
	await vault.refreshCheckpoints();

	reply.status(200).send({ message: 'Checkpoints regenerated successfully' });
};

export default {
	method: 'POST',
	url: '/sd/refresh-checkpoints',
	handler: refreshCheckpoints,
	onRequest: checkVault
} as RouteOptions;
