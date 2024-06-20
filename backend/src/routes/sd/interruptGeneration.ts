import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';

const interruptGeneration = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	await fetch('http://localhost:7861/sdapi/v1/interrupt', { method: 'POST' });

	reply.status(200).send({ message: 'Generation interrupted successfully'});
};

export default {
	method: 'POST',
	url: '/sd/interrupt',
	handler: interruptGeneration,
	onRequest: checkVault,
} as RouteOptions;