import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const resumePageWatcher = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	vault.resumeWatcher(id);
	return reply.send({ message: 'Watcher resumed successfully' });
};

export default {
	method: 'PATCH',
	url: '/watchers/:id/resume',
	handler: resumePageWatcher,
	onRequest: checkVault
} as RouteOptions;
