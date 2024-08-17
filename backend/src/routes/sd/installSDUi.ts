import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const installSDUi = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	if (vault.hasInstalledSD) {
		return reply.status(400).send('Vault has SD already installed');
	}

	await vault.installSDUi();

	reply.send({ message: 'SD ui installed successfully!' });
};

export default {
	method: 'POST',
	url: '/sd/install',
	handler: installSDUi,
	onRequest: checkVault
} as RouteOptions;
