import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';

const updateLora = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}


	reply.send();
};

export default {
	method: 'PUT',
	url: '/sd/loras/:id',
	handler: updateLora,
	onRequest: checkVault,
} as RouteOptions;