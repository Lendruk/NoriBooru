import { like } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { sdCheckpoints } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

type CheckpointQuery = {
	name: string;
};

const getSDCheckpoints = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { name: nameQuery } = request.query as CheckpointQuery;
	const { db } = vault;
	let checkpoints = [];

	if (nameQuery) {
		checkpoints = await db
			.select()
			.from(sdCheckpoints)
			.where(like(sdCheckpoints.name, `%${nameQuery}%`));
	} else {
		checkpoints = await db.query.sdCheckpoints.findMany();
	}

	reply.send(checkpoints);
};

export default {
	method: 'GET',
	url: '/sd/checkpoints',
	handler: getSDCheckpoints,
	onRequest: checkVault
} as RouteOptions;
