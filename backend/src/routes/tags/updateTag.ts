import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const updateTag = async (request: Request, reply: FastifyReply) => {
	const { vault } = request;
	const params = request.params as { id: string };
	const body = request.body as {
		parentId?: number;
		color: string;
		name: string;
	};

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const parsedId = Number.parseInt(params.id);
	if (!parsedId || Number.isNaN(parsedId)) {
		return reply.status(400).send('Invalid tag id sent');
	}

	const updatedTag = await vault.tags.updateTag(parsedId, body);

	return reply.send(updatedTag);
};

export default {
	method: 'PUT',
	url: '/tags/:id',
	handler: updateTag,
	onRequest: checkVault
} as RouteOptions;
