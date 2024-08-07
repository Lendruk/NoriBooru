import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getSDSchedulers = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = vault.getSdPort();
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/schedulers`);
	const body = await result.json();

	reply.send(body);
};

export default {
	method: 'GET',
	url: '/sd/schedulers',
	handler: getSDSchedulers,
	onRequest: checkVault
} as RouteOptions;
