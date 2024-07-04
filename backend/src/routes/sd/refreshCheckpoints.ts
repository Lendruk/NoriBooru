import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { sdUiService } from '../../services/SDUiService';
import { Request } from '../../types/Request';

const refreshCheckpoints = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = sdUiService.getSdPort(vault.id);
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-checkpoints`, {
		method: 'POST'
	});

	reply.status(200).send({ message: 'Checkpoints regenerated successfully' });
};

export default {
	method: 'POST',
	url: '/sd/refresh-checkpoints',
	handler: refreshCheckpoints,
	onRequest: checkVault
} as RouteOptions;
