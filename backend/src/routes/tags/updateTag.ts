import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { eq } from 'drizzle-orm';
import { tags } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

const updateTag = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const params = request.params as { id: string };
  const body = request.body as { parentId?: number, color: string, name: string };

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;
  const updated = await db.update(tags)
  .set({ name: body.name, parentTagId: body.parentId, color: body.color })
  .where(eq(tags.id, Number.parseInt(params.id ?? ""))).returning();

  return reply.send({ ...updated[0] });
};

export default {
	method: 'PUT',
	url: '/tags/:id',
	handler: updateTag,
  onRequest: checkVault,
} as RouteOptions;