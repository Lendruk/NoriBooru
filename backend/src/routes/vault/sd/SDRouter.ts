import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { SDService, Text2ImgPromptBody } from '../../../services/SD/SDService';
import { VaultConfig } from '../../../types/VaultConfig';

type PromptRequestBody = {
	autoTag: boolean;
	checkpointId: string;
	loras: string[];
	prompt: Text2ImgPromptBody;
};

/**
 * TODO: Add input validation
 */
@injectable()
export class SDRouter extends Router {
	private readonly SD_RESOURCES_DIR_NAME = 'sd-resources';
	public constructor(
		@inject(SDService) private readonly sdService: SDService,
		@inject('config') private readonly config: VaultConfig
	) {
		super();
	}

	// @Route.GET('/sd/progress')
	// public async getSDProgress(_: FastifyRequest, reply: FastifyReply) {
	// 	const sdPort = this.sdService.getSdPort();
	// 	if (!sdPort) {
	// 		return reply.status(400).send('SD Ui is not running for the given vault');
	// 	}

	// 	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/progress`);
	// 	const body = await result.json();

	// 	return reply.send(body);
	// }

	@Route.POST('/sd/scan-resources')
	public async scanResources(_: FastifyRequest, reply: FastifyReply) {
		return reply.send({ message: 'Resources scanned successfully!' });
	}

	@Route.GET('/sd/samplers')
	public async getSDSamplers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}
		// TODO: Convert this

		// const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/samplers`);
		// const body = await result.json();

		return reply.send([]);
	}

	@Route.GET('/sd/schedulers')
	public async getSDSchedulers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		const result = await fetch(`http://localhost:${sdPort}/sd/schedulers`);
		const body = (await result.json()) as Record<string, { name: string; description: string }>;

		const schedulers = [];
		for (const key in body) {
			schedulers.push({
				id: key,
				name: body[key].name,
				description: body[key].description
			});
		}

		return reply.send(schedulers);
	}

	@Route.GET('/sd/highres/upscalers')
	public async getHighResUpscalers(_: FastifyRequest, reply: FastifyReply) {
		const sdPort = this.sdService.getSdPort();
		if (!sdPort) {
			return reply.status(400).send('SD Ui is not running for the given vault');
		}

		// TODO: Convert this

		// const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/upscalers`);
		// const body = await result.json();

		return reply.send([]);
	}

	@Route.POST('/sd/start')
	public async startSdUi(_: FastifyRequest, reply: FastifyReply) {
		await this.sdService.startSDServer();
		reply.send({ message: 'SDUi has been started successfully!' });
	}

	@Route.POST('/sd/stop')
	public async stopSdUi(_: FastifyRequest, reply: FastifyReply) {
		await this.sdService.stopSDServer();
		reply.send({ message: 'SDUi has been stopped successfully!' });
	}

	// @Route.POST('/sd/install')
	// public async installSdUi(_: FastifyRequest, reply: FastifyReply) {
	// 	await this.sdService.installSDUi();
	// 	reply.send({ message: 'SD ui installed successfully!' });
	// }

	// @Route.POST('/sd/uninstall')
	// public async uninstallSdUi(_: FastifyRequest, reply: FastifyReply) {
	// 	if (!this.config.hasInstalledSD) {
	// 		return reply.status(400).send('Vault does not have SDUI installed');
	// 	}

	// 	await this.sdService.uninstallSDUi();
	// 	reply.send({ message: 'SD ui uninstalled successfully!' });
	// }

	@Route.POST('/sd/inactive')
	public async markSdAsInactive(_: FastifyRequest, reply: FastifyReply) {
		await this.sdService.markProcessAsInactive();
		reply.send({ message: 'SDUi has been marked as inactive successfully!' });
	}

	// @Route.POST('/sd/refresh-checkpoints')
	// public async refreshCheckpoints(_: FastifyRequest, reply: FastifyReply) {
	// 	await this.sdService.refreshCheckpoints();
	// 	reply.send({ message: 'Checkpoints refreshed successfully' });
	// }

	// @Route.POST('/sd/unload-checkpoint')
	// public async unloadCheckpoint(_: FastifyRequest, reply: FastifyReply) {
	// 	await this.sdService.unloadCurrentCheckpoint();
	// 	reply.send({ message: 'Checkpoint unloaded successfully' });
	// }

	@Route.POST('/sd/text2img')
	public async promptSd(request: FastifyRequest) {
		const { autoTag, checkpointId, loras, prompt } = request.body as PromptRequestBody;
		const items = await this.sdService.prompt({ autoTag, checkpointId, loras, prompt });
		return { items };
	}

	// @Route.POST('/sd/interrupt')
	// public async interruptGeneration(_: FastifyRequest, reply: FastifyReply) {
	// 	await this.sdService.interruptGeneration();
	// 	reply.send({ message: 'Generation interrupted successfully' });
	// }
}
