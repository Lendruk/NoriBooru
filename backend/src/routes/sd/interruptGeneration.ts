import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';

const interruptGeneration = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = sdUiService.getSdPort(vault.id);
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	await fetch(`http://localhost:${sdPort}/sdapi/v1/interrupt`, {
		method: 'POST'
	});

	reply.status(200).send({ message: 'Generation interrupted successfully' });
};

export default {
	method: 'POST',
	url: '/sd/interrupt',
	handler: interruptGeneration,
	onRequest: checkVault
} as RouteOptions;
