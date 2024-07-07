import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../hooks/checkVault';
import WildcardService from '../../../services/WildcardService';
import { Request } from '../../../types/Request';

type RequestBody = {
  name: string;
  values: string[]
}

const createWildcard = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const body = request.body as RequestBody;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const updatedWildcard = await WildcardService.createWildcard(vaultInstance, body.name, body.values);
	return reply.send(updatedWildcard);
};

export default {
	method: 'POST',
	url: '/sd/wildcards',
	handler: createWildcard,
	onRequest: checkVault
} as RouteOptions;
