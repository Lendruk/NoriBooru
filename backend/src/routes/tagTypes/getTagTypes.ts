import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';

const getTagTypes = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vault;
  const tagTypes = await db.query.tagTypes.findMany();
	reply.send(tagTypes);
};

export default {
	method: 'GET',
	url: '/tagTypes',
	handler: getTagTypes,
  onRequest: checkVault,
} as RouteOptions;