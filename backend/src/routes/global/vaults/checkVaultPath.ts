import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';

const checkVaultPath = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path: string; checkingForExistingVault?: boolean };
	if (body.path == '') {
		return reply.status(400).send({ message: 'Path cannot be empty' });
	}
	console.log(body.path);
	const isAbsolute = path.isAbsolute(body.path);
	if (isAbsolute) {
		try {
			const dirContent = await fs.readdir(body.path);
			if (dirContent.length > 0) {
				if (body.checkingForExistingVault) {
					if (
						dirContent.includes('vault.sqlite') &&
						dirContent.includes('vault.config.json') &&
						dirContent.includes('media')
					) {
						return reply.status(200).send({ message: 'Directory is a valid vault' });
					} else {
						return reply.status(400).send({ message: 'Directory is not a valid vault' });
					}
				} else {
					return reply.status(400).send({ message: 'Directory must be empty' });
				}
			}
		} catch {
			if (body.checkingForExistingVault) {
				return reply.status(400).send({ message: 'Directory is not a valid vault' });
			} else {
				return reply.status(200).send({ message: 'A new directory will be created' });
			}
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
