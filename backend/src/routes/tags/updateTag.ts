import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import TagService from '../../services/TagService';

const updateTag = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const params = request.params as { id: string };
	const body = request.body as {
		parentId?: number;
		color: string;
		name: string;
	};

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const parsedId = Number.parseInt(params.id);
	if (!parsedId || Number.isNaN(parsedId)) {
		return reply.status(400).send('Invalid tag id sent');
	}

	const updatedTag = await TagService.updateTag(vaultInstance, parsedId, body);

	return reply.send(updatedTag);
};

export default {
	method: 'PUT',
	url: '/tags/:id',
	handler: updateTag,
	onRequest: checkVault
} as RouteOptions;
