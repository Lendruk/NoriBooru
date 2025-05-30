import { endpoints } from '$lib/endpoints';
import { RunningJob } from '$lib/types/RunningJob';
import type { Vault } from '$lib/types/Vault';
import { get } from 'svelte/store';
import { runningJobs, vaultStore } from '../../store';

type RedirectResponse = {
	message: string;
	port: number;
};

export type ApiEndpoint = {
	url: string;
	isGlobal: boolean;
};

export class HttpService {
	public static GLOBAL_PORT = 8080;
	public static BASE_URL = `http://127.0.0.1`;

	public static getVaultId(): string | undefined {
		const curVault = get(vaultStore);
		if (curVault) {
			return curVault.id;
		} else {
			const storedVault = localStorage.getItem('currentVault');
			if (storedVault) {
				return (JSON.parse(storedVault) as Vault).id;
			}
		}
	}

	public static getVaultPort(): number | undefined {
		const curVault = get(vaultStore);
		if (curVault) {
			return curVault.port;
		}
	}

	private static buildUrl(endpoint: string, port: number): string {
		return `${this.BASE_URL}:${port}${endpoint}`;
	}

	public static async refreshPort(): Promise<number> {
		const endpoint = endpoints.getVaultPort({ id: this.getVaultId() });
		const portResponse = await this.request<{ port: number }>({
			url: endpoint.url,
			isGlobalRequest: endpoint.isGlobal,
			method: 'GET'
		});
		vaultStore.update((vault) => ({ ...vault!, port: portResponse.port }));
		return portResponse.port;
	}

	private static async request<T>(options: {
		url: string;
		method: string;
		isGlobalRequest?: boolean;
		body?: Record<string, unknown> | FormData;
		headers?: Record<string, string>;
	}): Promise<T> {
		const { url, method, body } = options;
		let { headers } = options;

		if (!headers) {
			headers = {};
		}

		let port = options.isGlobalRequest ? this.GLOBAL_PORT : this.getVaultPort();

		if (method !== 'DELETE') {
			if (!(body instanceof FormData)) {
				headers['Content-Type'] = 'application/json';
			} else {
				headers['Content-Type'] = 'multipart/form-data';
			}
		}

		if (!port) {
			port = await this.refreshPort();
		}

		const response = await fetch(this.buildUrl(url, port), {
			method,
			headers: {
				vault: this.getVaultId() || '',
				...headers
			},
			body: body ? JSON.stringify(body) : undefined
		});

		if (response.status === 308) {
			const responseBody = (await response.json()) as RedirectResponse;
			vaultStore.update((vault) => ({ ...vault!, port: responseBody.port }));
			return this.request<T>({ url, method, body, isGlobalRequest: false });
		}
		if (response.status > 400) {
			throw new Error(`Error during request status: ${response.status}`);
		} else {
			return response.json() as Promise<T>;
		}
	}

	public static async get<T>(endpoint: ApiEndpoint): Promise<T> {
		const { url, isGlobal } = endpoint;
		return this.request({ url, method: 'GET', isGlobalRequest: isGlobal });
	}

	public static async post<T>(
		endpoint: ApiEndpoint,
		body?: Record<string, unknown> | FormData
	): Promise<T> {
		const { url, isGlobal } = endpoint;
		return this.request({ url, method: 'POST', isGlobalRequest: isGlobal, body: body ?? {} });
	}

	public static async postJob<T>(
		url: string,
		body?: Record<string, unknown> | FormData
	): Promise<RunningJob<T>> {
		const headers: Record<string, string> = {
			vault: this.getVaultId() || ''
		};

		if (!(body instanceof FormData)) {
			headers['Content-Type'] = 'application/json';
		}

		const port = this.getVaultPort();

		if (!port) {
			throw new Error('Port not found');
		}

		const response = await fetch(this.buildUrl(url, port), {
			method: 'POST',
			headers,
			body: body instanceof FormData ? body : JSON.stringify(body ?? {})
		});

		if (response.status >= 400) {
			let errorBody: { message: string } = { message: '' };
			try {
				errorBody = (await response.json()) as { message: string };
			} catch {
				throw new Error(`Error during request status: ${response.status}`);
			}
			throw new Error(errorBody.message);
		}

		const jobData = (await response.json()) as Pick<RunningJob<T>, 'id' | 'name' | 'tag'>;
		const newJob = new RunningJob<T>(jobData.id, jobData.name, jobData.tag, {});
		runningJobs.update((jobs) => {
			jobs.push(newJob);
			return jobs;
		});
		return newJob;
	}
	public static async put<T>(endpoint: ApiEndpoint, body: Record<string, unknown>): Promise<T> {
		const { url, isGlobal } = endpoint;
		return this.request({ url, method: 'PUT', isGlobalRequest: isGlobal, body });
	}

	public static async delete<T>(endpoint: ApiEndpoint, body?: Record<string, unknown>): Promise<T> {
		const { url, isGlobal } = endpoint;
		return this.request({ url, method: 'DELETE', isGlobalRequest: isGlobal, body });
	}

	public static async patch<T>(endpoint: ApiEndpoint, body?: Record<string, unknown>): Promise<T> {
		const { url, isGlobal } = endpoint;
		return this.request({ url, method: 'PATCH', isGlobalRequest: isGlobal, body });
	}

	public static buildGetImageThumbnailUrl(fileName: string, extension: string): string {
		return `${this.BASE_URL}:${this.getVaultPort()}/images/thumb/${fileName}.${extension === 'gif' ? 'webp' : 'jpg'}`;
	}

	public static buildGetVideoThumbnailUrl(fileName: string): string {
		return `${this.BASE_URL}:${this.getVaultPort()}/videos/thumb/${fileName}.mp4`;
	}

	public static buildGetImageUrl(fileName: string, extension: string): string {
		return `${this.BASE_URL}:${this.getVaultPort()}/images/${fileName}.${extension}`;
	}

	public static buildGetVideoUrl(fileName: string, extension: string): string {
		return `${this.BASE_URL}:${this.getVaultPort()}/videos/${fileName}.${extension}`;
	}
}
