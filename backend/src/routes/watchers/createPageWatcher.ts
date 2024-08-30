import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { PageParserFactory } from '../../lib/watchers/PageParserFactory';
import { WatcherSource } from '../../lib/watchers/WatcherSource';
import { Request } from '../../types/Request';

type RequestBody = {
	url?: string;
};

const getSourceFromUrl = (url: string): WatcherSource => {
	if (url.includes('4chan.org')) {
		return '4chan';
	}
	throw new Error('Invalid url');
};

const createWatcher = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const body = request.body as RequestBody;
	if (!body?.url) {
		return reply.status(400).send('No url provided');
	}

	const { db } = vault;

	const source = getSourceFromUrl(body.url);
	const parser = PageParserFactory.createParser(source);

	await parser.queryPage({ url: body.url } as any);
	return reply.send({ message: 'Watcher created successfully' });
};

export default {
	method: 'POST',
	url: '/watchers',
	handler: createWatcher,
	onRequest: checkVault
} as RouteOptions;
