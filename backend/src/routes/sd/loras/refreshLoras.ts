import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { Request } from '../../../types/Request';

const refreshLoras = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = vault.getSdPort();
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-loras`, {
		method: 'POST'
	});

	reply.status(200).send({ message: 'Loras regenerated successfully' });
};

export default {
	method: 'POST',
	url: '/sd/refresh-loras',
	handler: refreshLoras,
	onRequest: checkVault
} as RouteOptions;
