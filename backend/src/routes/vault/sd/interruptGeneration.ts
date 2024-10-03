import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const interruptGeneration = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = vault.stableDiffusion.getSdPort();
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
