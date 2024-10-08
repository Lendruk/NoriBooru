import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { SDService } from '../../../services/SDService';

@injectable()
export class SDRouter extends Router {
	public constructor(@inject(SDService) private readonly sdService: SDService) {
		super();
	}

	@Route.GET('/sd/progress')
	public async getSDProgress(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/progress`);
		const body = await result.json();

		return reply.send(body);
	}

	@Route.GET('/sd/samplers')
	public async getSDSamplers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/samplers`);
		const body = await result.json();

		return reply.send(body);
	}

	@Route.GET('/sd/schedulers')
	public async getSDSchedulers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/schedulers`);
		const body = await result.json();

		return reply.send(body);
	}

	@Route.GET('/sd/highres/upscalers')
	public async getHighResUpscalers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/upscalers`);
		const body = await result.json();

		return reply.send(body);
	}
}
