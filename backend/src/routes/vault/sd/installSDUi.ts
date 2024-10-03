import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const installSDUi = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	if (vault.config.hasInstalledSD) {
		return reply.status(400).send('Vault has SD already installed');
	}

	await vault.stableDiffusion.installSDUi();

	reply.send({ message: 'SD ui installed successfully!' });
};

export default {
	method: 'POST',
	url: '/sd/install',
	handler: installSDUi,
	onRequest: checkVault
} as RouteOptions;
