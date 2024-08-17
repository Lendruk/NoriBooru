import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const uninstallSDUi = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	if (!vault.hasInstalledSD) {
		return reply.status(400).send('Vault does not have SDUI installed');
	}

	await vault.uninstallSDUi();

	reply.send({ message: 'SD ui installed successfully!' });
};

export default {
	method: 'POST',
	url: '/sd/uninstall',
	handler: uninstallSDUi,
	onRequest: checkVault
} as RouteOptions;
