import { FastifyReply, RouteOptions } from "fastify";
import { Request } from "../../types/Request";
import { checkVault } from "../../hooks/checkVault";
import { tagTypes } from "../../db/vault/schema";
import { eq } from "drizzle-orm";

const updateTagType = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const params = request.params as { id: string };
  const body = request.body as { color: string, name: string };

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;
  const updated = await db.update(tagTypes)
  .set({ name: body.name, color: body.color})
  .where(eq(tagTypes.id, Number.parseInt(params.id ?? ""))).returning();

  return reply.send(updated[0]);
}

export default {
	method: 'PUT',
	url: '/tagTypes/:id',
	handler: updateTagType,
  onRequest: checkVault,
} as RouteOptions;