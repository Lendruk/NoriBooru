import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import { sdLoras } from '../../../../db/vault/schema';
import { checkVault } from '../../../../hooks/checkVault';
import { VaultRequest } from '../../../../types/Request';

const deleteLora = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const { id } = request.params as { id: string };
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	const lora = await db.query.sdLoras.findFirst({ where: eq(sdLoras.id, id) });
	if (lora) {
		await fs.unlink(lora.path);
	}

	await db.delete(sdLoras).where(eq(sdLoras.id, id));
	reply.send({ message: 'Lora deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/sd/loras/:id',
	handler: deleteLora,
	onRequest: checkVault
} as RouteOptions;
