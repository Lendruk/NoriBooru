import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import TagService from '../../services/TagService';

const deleteTag = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const params = request.params as { id: string };

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const parsedId = Number.parseInt(params.id);
	if (!parsedId || Number.isNaN(parsedId)) {
		return reply.status(400).send('Invalid tag id sent');
	}

	await TagService.deleteTag(vaultInstance, parsedId);
	return reply.send({ message: 'Tag deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/tags/:id',
	handler: deleteTag,
	onRequest: checkVault
} as RouteOptions;
