import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

type RequestBody = {
	url?: string;
	description?: string;
	requestInterval: number;
	itemsPerRequest: number;
	inactivityTimeout: number;
};

const createWatcher = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const body = request.body as RequestBody;
	if (!body?.url) {
		return reply.status(400).send('No url provided');
	}

	if (!body.requestInterval) {
		return reply.status(400).send('No request interval provided');
	}

	if (!body.itemsPerRequest) {
		return reply.status(400).send('No items per request provided');
	}

	if (!body.inactivityTimeout) {
		return reply.status(400).send('No inactivity timeout provided');
	}

	if (vault.watchers.isThereWatcherWithUrl(body.url)) {
		return reply.status(400).send('Watcher with this url already exists');
	}

	const watcher = await vault.watchers.createWatcher(
		body.url,
		body.description ?? '',
		body.requestInterval,
		body.itemsPerRequest,
		body.inactivityTimeout
	);
	return reply.send({ ...watcher.toSchema() });
};

export default {
	method: 'POST',
	url: '/watchers',
	handler: createWatcher,
	onRequest: checkVault
} as RouteOptions;
