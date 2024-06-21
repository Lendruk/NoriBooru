import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';

const getPrompts = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;

	if(!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const prompts = await db.query.sdPrompts.findMany();
	
	return reply.send(prompts);
};


export default {
	method: 'GET',
	url: '/sd/prompts',
	handler: getPrompts,
	onRequest: checkVault,
} as RouteOptions;