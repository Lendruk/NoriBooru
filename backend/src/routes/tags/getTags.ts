import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { like } from 'drizzle-orm';
import { tags } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

const getTags = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const query = request.query as { name: string };

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;

  const {name} = query;
  let foundTags = [];
  if (name) {
    foundTags = await db.query.tags.findMany({ where: like(tags.name, `%${name}%`) });
  } else {
    foundTags = await db.query.tags.findMany({ with: { tagType: true } });
  }  

  return reply.send(foundTags);
};

export default {
	method: 'GET',
	url: '/tags',
	handler: getTags,
  onRequest: checkVault,
} as RouteOptions;