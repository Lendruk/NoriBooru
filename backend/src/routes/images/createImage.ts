import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { TagSchema } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';

const createImage = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const body = request.body as { image: string, tags: TagSchema[] };
	const imageBase64 = body.image;
	const { id } = await mediaService.createImageFromBase64(imageBase64, vault);

	return reply.send({ message: 'Image registered', id });
};

export default {
	method: 'POST',
	url: '/images',
	handler: createImage,
	onRequest: checkVault,
} as RouteOptions;