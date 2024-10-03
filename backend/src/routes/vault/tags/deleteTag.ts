import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const deleteTag = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;
	const params = request.params as { id: string };

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const parsedId = Number.parseInt(params.id);
	if (!parsedId || Number.isNaN(parsedId)) {
		return reply.status(400).send('Invalid tag id sent');
	}

	await vault.tags.deleteTag(parsedId);
	return reply.send({ message: 'Tag deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/tags/:id',
	handler: deleteTag,
	onRequest: checkVault
} as RouteOptions;
