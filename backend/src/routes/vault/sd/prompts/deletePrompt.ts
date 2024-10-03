import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { sdPrompts } from '../../../../db/vault/schema';
import { checkVault } from '../../../../hooks/checkVault';
import { VaultRequest } from '../../../../types/Request';

const deletePrompt = async (request: VaultRequest, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const params = request.params as { id: string };

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	await db.delete(sdPrompts).where(eq(sdPrompts.id, params.id));

	return reply.send({ message: 'Prompt deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/sd/prompts/:id',
	handler: deletePrompt,
	onRequest: checkVault
} as RouteOptions;
