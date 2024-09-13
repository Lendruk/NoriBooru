import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { PopulatedTag } from '../../services/TagService';
import { Request } from '../../types/Request';

const getTags = async (request: Request, reply: FastifyReply) => {
	const { vault } = request;
	const query = request.query as { name: string };
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { name } = query;
	const finalTags: PopulatedTag[] = await vault.tags.getAllTags(name);
	return reply.send(finalTags);
};

export default {
	method: 'GET',
	url: '/tags',
	handler: getTags,
	onRequest: checkVault
} as RouteOptions;
