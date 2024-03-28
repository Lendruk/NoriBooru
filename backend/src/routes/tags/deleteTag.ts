import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { eq } from 'drizzle-orm';
import { tags } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

const deleteTag = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const params = request.params as { id: string };

	if(!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	await db.delete(tags).where(eq(tags.id, Number.parseInt(params.id ?? '')));

	return reply.send({ message: 'Tag deleted successfully'});
};

export default {
	method: 'DELETE',
	url: '/tags/:id',
	handler: deleteTag,
	onRequest: checkVault,
} as RouteOptions;