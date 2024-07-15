import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getSDCheckpoints = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;
	const checkpoints = await db.query.sdCheckpoints.findMany();

	reply.send(checkpoints);
};

export default {
	method: 'GET',
	url: '/sd/checkpoints',
	handler: getSDCheckpoints,
	onRequest: checkVault
} as RouteOptions;
