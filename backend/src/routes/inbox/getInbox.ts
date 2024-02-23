import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { INBOX_PATH } from './common';
import * as fs from 'fs/promises';

const getInbox = async (request: Request, reply: FastifyReply) => {
  const inboxFiles = await fs.readdir(INBOX_PATH);
  return reply.send(inboxFiles);
};

export default {
	method: 'GET',
	url: '/inbox',
	handler: getInbox,
} as RouteOptions;