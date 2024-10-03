import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const getHighresUpscalers = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = vault.stableDiffusion.getSdPort();
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
	onRequest: checkVault
} as RouteOptions;
