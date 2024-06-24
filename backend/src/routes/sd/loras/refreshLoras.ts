import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';

const refreshLoras = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	await fetch('http://localhost:7861/sdapi/v1/refresh-loras', { method: 'POST' });

	reply.status(200).send({ message: 'Loras regenerated successfully'});
};

export default {
	method: 'POST',
	url: '/sd/refresh-loras',
	handler: refreshLoras,
	onRequest: checkVault,
} as RouteOptions;