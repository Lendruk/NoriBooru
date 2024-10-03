import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const deleteWatcher = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	vault.watchers.deleteWatcher(id);
	return reply.send({ message: 'Watcher deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/watchers/:id',
	handler: deleteWatcher,
	onRequest: checkVault
} as RouteOptions;
