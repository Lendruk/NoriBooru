import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { SDLoraSchema, tagsToLoras } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { PopulatedTag } from '../../../services/TagService';
import { Request } from '../../../types/Request';
import { SDLora } from '../../../types/sd/SDLora';

type LoraQuery = {
	tags: string;
	name: string;
};

const getLoras = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	const { tags, name: nameQuery } = request.query as LoraQuery;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;
	const savedLoras = (await db.query.sdLoras.findMany()) as SDLoraSchema[];
	const finalLoraArr: SDLora[] = [];

	let queryTagArr: number[] = [];
	if (tags) {
		queryTagArr = tags.split(',').map((id) => Number.parseInt(id));
	}

	for (const savedLora of savedLoras) {
		const tagLoraPairs =
			(await db.query.tagsToLoras.findMany({
				where: eq(tagsToLoras.loraId, savedLora.id)
			})) ?? [];
		const tags = await vault.tags.populateTagsById(tagLoraPairs.map(({ tagId }) => tagId));

		if (matchesTagFilter(queryTagArr, tags) && matchesNameQuery(savedLora.name, nameQuery)) {
			finalLoraArr.push({
				...savedLora,
				activationWords: savedLora.activationWords ? JSON.parse(savedLora.activationWords) : [],
				metadata: savedLora.metadata ? JSON.parse(savedLora.metadata) : {},
				tags
			});
		}
	}
	reply.send(finalLoraArr);
};

const matchesNameQuery = (loraName: string, nameQuery?: string): boolean => {
	if (nameQuery && !loraName.toLowerCase().includes(nameQuery.toLowerCase())) {
		return false;
	}
	return true;
};

const matchesTagFilter = (filters: number[], loraTags: PopulatedTag[]): boolean => {
	if (filters.length > 0) {
		for (const tagId of filters) {
			if (!loraTags.find((tag) => tag.id === tagId)) {
				return false;
			}
		}
	}
	return true;
};

export default {
	method: 'GET',
	url: '/sd/loras',
	handler: getLoras,
	onRequest: checkVault
} as RouteOptions;
