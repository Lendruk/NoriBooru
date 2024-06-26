import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';

const getHighresUpscalers = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = sdUiService.getSdPort(vault.id);
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/upscalers`);
	const body = await result.json();

	reply.send(body);
};

export default {
	method: 'GET',
	url: '/sd/highres/upscalers',
	handler: getHighresUpscalers,
	onRequest: checkVault,
} as RouteOptions;