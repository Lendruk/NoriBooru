import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import path from 'path';
import * as fs from 'fs/promises';

const getImageThumbnail = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const params = request.params as { fileName: string };

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { vault } = vaultInstance;

  const fileName = params.fileName;
  const imagePath = path.join(vault.path, 'media', 'images', '.thumb', `${fileName}`);
  const image = await fs.readFile(imagePath);

  return reply.header('Content-Type', 'image/jpg').send(image);
};

export default {
	method: 'GET',
	url: '/images/thumb/:fileName',
	handler: getImageThumbnail,
} as RouteOptions;