import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const resumePageWatcher = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	vault.watchers.resumeWatcher(id);
	return reply.send({ message: 'Watcher resumed successfully' });
};

export default {
	method: 'PATCH',
	url: '/watchers/:id/resume',
	handler: resumePageWatcher,
	onRequest: checkVault
} as RouteOptions;
