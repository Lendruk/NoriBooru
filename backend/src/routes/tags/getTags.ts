import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { eq, like } from 'drizzle-orm';
import { TagTableSchema, tags } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { VaultInstance } from '../../db/VaultController';

type SimpleTag = Omit<TagTableSchema, 'parentTagId'>;
type PopulatedTag = SimpleTag & { parent: SimpleTag | null, subTags: PopulatedTag[] };
const getTags = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const query = request.query as { name: string };

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;

  const {name} = query;
  let foundTags: TagTableSchema[] = [];
  if (name) {
    foundTags = await db.query.tags.findMany({ where: like(tags.name, `%${name}%`) });
  } else {
    foundTags = await db.query.tags.findMany();
  }  

  let finalTags: PopulatedTag[] = [];
  let promises: Promise<PopulatedTag>[] = [];
  for(const tag of foundTags) {
    promises.push(populateTag(vaultInstance, tag));
  }
  finalTags = await Promise.all(promises);

  return reply.send(finalTags);
};

const populateTag = async (vaultInstance: VaultInstance, tag: TagTableSchema): Promise<PopulatedTag> => {
  let parentTag: SimpleTag | null = null;
  if (tag.parentTagId) {
    const result = await vaultInstance.db.query.tags.findFirst({ where: eq(tags.id, tag.parentTagId) });
    if (result) {
      parentTag = {
        color: result.color,
        id: result.id,
        mediaCount: result.mediaCount,
        name: result.name,
      }
    }
  }

  let subTags: PopulatedTag[] = [];
  const foundSubTags = await vaultInstance.db.query.tags.findMany({ where: eq(tags.parentTagId, tag.id)});
  if (foundSubTags) {
    const promises: Promise<PopulatedTag>[] = [];
    for(const subTag of foundSubTags) {
      promises.push(populateTag(vaultInstance, subTag));
    }
    subTags = await Promise.all(promises);
  }

  return {
    color: tag.color,
    id: tag.id,
    mediaCount: tag.mediaCount,
    name: tag.name,
    parent: parentTag,
    subTags
  };
};


export default {
	method: 'GET',
	url: '/tags',
	handler: getTags,
  onRequest: checkVault,
} as RouteOptions;