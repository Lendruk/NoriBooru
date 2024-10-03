import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

type RequestBody = {
	description?: string;
	requestInterval: number;
	itemsPerRequest: number;
	inactivityTimeout: number;
};

const updateWatcher = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };

	const body = request.body as RequestBody;
	if (!body.requestInterval) {
		return reply.status(400).send('No request interval provided');
	}

	if (!body.itemsPerRequest) {
		return reply.status(400).send('No items per request provided');
	}

	if (!body.inactivityTimeout) {
		return reply.status(400).send('No inactivity timeout provided');
	}

	const watcher = await vault.watchers.updateWatcher(
		id,
		body.description ?? '',
		body.requestInterval,
		body.itemsPerRequest,
		body.inactivityTimeout
	);
	return reply.send({ ...watcher.toSchema() });
};

export default {
	method: 'PUT',
	url: '/watchers/:id',
	handler: updateWatcher,
	onRequest: checkVault
} as RouteOptions;
