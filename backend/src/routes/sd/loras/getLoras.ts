import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { SDLoraSchema, sdLoras, tagsToLoras } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { sdUiService } from '../../../services/SDUiService';
import TagService, { PopulatedTag } from '../../../services/TagService';
import { Request } from '../../../types/Request';
import { SDLora } from '../../../types/sd/SDLora';

type RawSDLora = {
	name: string;
	alias: string;
	path: string;
	metadata: {
		ss_sd_model_name: string;
		ss_resolution: string;
		ss_clip_skip: string;
		ss_num_train_images: string;
		ss_tag_frequency: {
			['1_cate']: Record<string, number>;
		};
	};
};

type LoraQuery = {
	tags: string;
	name: string;
}

const getLoras = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	const { tags, name: nameQuery } = request.query as LoraQuery;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = sdUiService.getSdPort(vault.id);
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/loras`);
	const sdClientLoras = (await result.json()) as RawSDLora[];
	const { db } = vault;
	const savedLoras = (await db.query.sdLoras.findMany()) as SDLoraSchema[];
	const finalLoraArr: SDLora[] = [];

	let queryTagArr: number[] = [];
	if (tags) {
		queryTagArr = tags.split(',').map(id => Number.parseInt(id));
	}

	for (const rawLora of sdClientLoras) {
		const savedLora = savedLoras.find((lora) => lora.path === rawLora.path);

		if (!savedLora) {
			const newSavedLora = (
				await db
					.insert(sdLoras)
					.values({
						id: randomUUID(),
						name: rawLora.name,
						path: rawLora.path,
						activationWords: ''
					})
					.returning()
			)[0];

			if (queryTagArr.length === 0) {
				finalLoraArr.push(convertDBLora(rawLora, newSavedLora, []));
			}
		} else {
			const tagLoraPairs =
				(await db.query.tagsToLoras.findMany({
					where: eq(tagsToLoras.loraId, savedLora.id)
				})) ?? [];
			const tags = await TagService.populateTagsById(
				vault,
				tagLoraPairs.map(({ tagId }) => tagId)
			);

			if (matchesTagFilter(queryTagArr, tags) && matchesNameQuery(savedLora.name, nameQuery)) {
				finalLoraArr.push(convertDBLora(rawLora, savedLora, tags));
			}
		}
	}
	reply.send(finalLoraArr);
};

const convertDBLora = (
	rawSDLora: RawSDLora,
	dbLora: SDLoraSchema,
	tags: PopulatedTag[]
): SDLora => {
	return {
		alias: rawSDLora.alias,
		metadata: rawSDLora.metadata,
		id: dbLora.id,
		name: dbLora.name,
		path: dbLora.path,
		previewImage: dbLora.previewImage,
		tags
	};
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
			if (!loraTags.find(tag => tag.id === tagId)) {
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
