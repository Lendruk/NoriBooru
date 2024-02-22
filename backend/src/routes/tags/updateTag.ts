import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { eq } from 'drizzle-orm';
import { tagTypes, tags } from '../../db/vault/schema';

const updateTag = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const params = request.params as { id: string };
  const body = request.body as { tagTypeId: number, name: string };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const updated = await db.update(tags)
  .set({ name: body.name, tagTypeId: body.tagTypeId})
  .where(eq(tags.id, Number.parseInt(params.id ?? ""))).returning();

  const tagType = await db.query.tagTypes.findFirst({ where: eq(tagTypes.id, body.tagTypeId ) });
  return reply.send({ ...updated[0], tagType: tagType });
};

export default {
	method: 'PUT',
	url: '/tags/:id',
	handler: updateTag,
} as RouteOptions;