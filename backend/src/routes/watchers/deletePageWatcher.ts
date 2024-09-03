import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const deleteWatcher = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	vault.deleteWatcher(id);
	return reply.send({ message: 'Watcher deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/watchers/:id',
	handler: deleteWatcher,
	onRequest: checkVault
} as RouteOptions;
