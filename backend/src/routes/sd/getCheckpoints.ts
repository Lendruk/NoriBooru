import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getSDCheckpoints = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	// const sdPort = vault.getSdPort();
	// if (!sdPort) {
	// 	return reply.status(400).send('SD Ui is not running for the given vault');
	// }

	const { db } = vault;
	// const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/sd-models`);
	const checkpoints = await db.query.sdCheckpoints.findMany();
	// const body = await result.json() as RawSDCheckpoint[];

	reply.send(checkpoints);
};

export default {
	method: 'GET',
	url: '/sd/checkpoints',
	handler: getSDCheckpoints,
	onRequest: checkVault
} as RouteOptions;
