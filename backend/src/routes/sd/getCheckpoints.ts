import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';

const getSDCheckpoints = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const result = await fetch('http://localhost:7861/sdapi/v1/sd-models');
	const body = await result.json();

	reply.send(body);
};

export default {
	method: 'GET',
	url: '/sd/checkpoints',
	handler: getSDCheckpoints,
	onRequest: checkVault,
} as RouteOptions;