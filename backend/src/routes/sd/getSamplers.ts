import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';

const getSDSamplers = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const result = await fetch('http://localhost:7861/sdapi/v1/samplers');
	const body = await result.json();

	reply.send(body);
};

export default {
	method: 'GET',
	url: '/sd/samplers',
	handler: getSDSamplers,
	onRequest: checkVault,
} as RouteOptions;