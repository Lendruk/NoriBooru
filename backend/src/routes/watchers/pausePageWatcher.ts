import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const pauseWatcher = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	vault.watchers.pauseWatcher(id);
	return reply.send({ message: 'Watcher paused successfully' });
};

export default {
	method: 'PATCH',
	url: '/watchers/:id/pause',
	handler: pauseWatcher,
	onRequest: checkVault
} as RouteOptions;
