import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';

const startSDUi= async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	await sdUiService.startSDUi(vault);

	reply.send({ message: 'SDUi has been started successfully!'});
};

export default {
	method: 'POST',
	url: '/sd/start',
	handler: startSDUi,
	onRequest: checkVault,
} as RouteOptions;