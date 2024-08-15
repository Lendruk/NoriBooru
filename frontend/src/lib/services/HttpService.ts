import { RunningJob } from '$lib/types/RunningJob';
import type { Vault } from '$lib/types/Vault';
import { get } from 'svelte/store';
import { runningJobs, vaultStore } from '../../store';

export class HttpService {
	public static BASE_URL = `http://localhost:8080`;

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

	public static async get<T>(url: string): Promise<T> {
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				vault: this.getVaultId() || ''
			}
		});

		if (response.status >= 400) {
			throw new Error(`Error during request status: ${response.status}`);
		}

		return response.json() as Promise<T>;
	}

	public static async post<T>(url: string, body?: Record<string, unknown> | FormData): Promise<T> {
		const headers: Record<string, string> = {
			vault: this.getVaultId() || ''
		};

		if (!(body instanceof FormData)) {
			headers['Content-Type'] = 'application/json';
		}
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
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

		return response.json() as Promise<T>;
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
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
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
	public static async put<T>(url: string, body: Record<string, unknown>): Promise<T> {
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				vault: this.getVaultId() || ''
			},
			body: JSON.stringify(body)
		});

		if (response.status >= 400) {
			throw new Error(`Error during request status: ${response.status}`);
		}

		return response.json() as Promise<T>;
	}

	public static async delete<T>(url: string, body?: Record<string, unknown>): Promise<T> {
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				vault: this.getVaultId() || ''
			},
			body: JSON.stringify(body)
		});

		if (response.status >= 400) {
			throw new Error(`Error during request status: ${response.status}`);
		}

		return response.json() as Promise<T>;
	}

	public static async patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
		const response = await fetch(`${HttpService.BASE_URL}${url}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				vault: this.getVaultId() || ''
			},
			body: JSON.stringify(body ?? {})
		});

		if (response.status >= 400) {
			throw new Error(`Error during request status: ${response.status}`);
		}

		return response.json() as Promise<T>;
	}
}
