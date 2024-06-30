import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import TagService from '../../services/TagService';

const createTag = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const body = request.body as { name: string, color: string, parentId?: number };
	if(!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const newTag = await TagService.createTag(vaultInstance, body.name, body.color, body.parentId);
	return reply.send(newTag);
};

export default {
	method: 'POST',
	url: '/tags',
	handler: createTag,
	onRequest: checkVault,
} as RouteOptions;