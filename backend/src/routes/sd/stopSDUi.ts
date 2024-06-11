import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';

const stopSDUi= async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	await sdUiService.stopSDUi(vault);
};

export default {
	method: 'POST',
	url: '/sd/stop',
	handler: stopSDUi,
	onRequest: checkVault,
} as RouteOptions;