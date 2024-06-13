import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';

const markSDAsInactive= async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	await sdUiService.markProcessAsInactive(vault);
};

export default {
	method: 'POST',
	url: '/sd/inactive',
	handler: markSDAsInactive,
	onRequest: checkVault,
} as RouteOptions;