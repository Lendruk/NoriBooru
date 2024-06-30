import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';
import { sdLoras } from '../../../db/vault/schema';
import { eq } from 'drizzle-orm';

const deleteLora = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	const { id } = request.params as { id: string };
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	await db.delete(sdLoras).where(eq(sdLoras.id, id ));
	reply.send({ message: 'Lora deleted successfully '});
};

export default {
	method: 'DELETE',
	url: '/sd/loras/:id',
	handler: deleteLora,
	onRequest: checkVault,
} as RouteOptions;