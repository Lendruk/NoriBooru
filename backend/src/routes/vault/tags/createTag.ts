import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const createTag = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;
	const body = request.body as {
		name: string;
		color: string;
		parentId?: number;
	};
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const newTag = await vault.tags.createTag(body.name, body.color, body.parentId);
	return reply.send(newTag);
};

export default {
	method: 'POST',
	url: '/tags',
	handler: createTag,
	onRequest: checkVault
} as RouteOptions;
