import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { masterDb } from '../../db/master/db';
import { vaults } from '../../db/master/schema';

const renameVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { name: string };
	const params = request.params as { id: string };

	const updatedVault = await masterDb
		.update(vaults)
		.set({ name: body.name })
		.where(eq(vaults.id, params.id))
		.returning();

	return reply.send(updatedVault[0]);
};

export default {
	method: 'PUT',
	url: '/vaults/:id',
	handler: renameVault
} as RouteOptions;
