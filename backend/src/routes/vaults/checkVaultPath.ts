import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';

const checkVaultPath = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path: string };
	if (body.path == '') {
		return reply.status(400).send({ message: 'Path cannot be empty' });
	}
	const isAbsolute = path.isAbsolute(body.path);
	if (isAbsolute) {
		try {
			const dirContent = await fs.readdir(body.path);
			if (dirContent.length > 0) {
				return reply.status(400).send({ message: 'Directory must be empty' });
			}
		} catch {
			return reply.status(200).send({ message: 'A new directory will be created' });
		}
	} else {
		return reply.status(400).send({ message: 'Path must be absolute' });
	}

	return reply.send({ message: 'Path is valid' });
};

export default {
	method: 'POST',
	url: '/vaults/check-path',
	handler: checkVaultPath
} as RouteOptions;
