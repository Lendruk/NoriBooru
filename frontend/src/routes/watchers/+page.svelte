<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import DurationPicker from '$lib/components/DurationPicker.svelte';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';
	import Link from '$lib/components/Link.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import LinkIcon from '$lib/icons/LinkIcon.svelte';
	import PauseIcon from '$lib/icons/PauseIcon.svelte';
	import PenIcon from '$lib/icons/PenIcon.svelte';
	import PlayIcon from '$lib/icons/PlayIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { WebSocketEvent } from '$lib/services/WebsocketService';
	import type { Watcher } from '$lib/types/Watcher';
	import { onDestroy } from 'svelte';
	import type { Unsubscriber } from 'svelte/store';
	import { socketEvents$ } from '../../store';
	import Gallery from '../gallery/Gallery.svelte';

	type WatcherUpdateSocketEvent = {
		id: string;
	};

	let watchers: Watcher[] = $state([]);
	let selectedWatcher: Watcher | undefined = $state(undefined);

	const REQUEST_INTERVAL_DEFAULT = 60000;
	const ITEMS_PER_REQUEST_DEFAULT = 10;
	const INACTIVITY_TIMEOUT_DEFAULT = 3600000;

	let refreshGallery: () => Promise<void>;
	let wsUnsubscriber: Unsubscriber | undefined = $state(undefined);

	// Modal
	let isCreatingWatcher = $state(false);
	let showModal = $state(false);
	let modalWatcherUrl = $state('');
	let isUrlValid = $state(true);
	let requestInterval = $state(REQUEST_INTERVAL_DEFAULT); // ms
	let itemsPerRequest = $state(ITEMS_PER_REQUEST_DEFAULT);
	let inactivityTimeout = $state(INACTIVITY_TIMEOUT_DEFAULT); // ms

	async function deleteWatcher(watcherId: string) {
		await HttpService.delete(`/watchers/${watcherId}`);
		watchers = watchers.filter((watcher) => watcher.id !== watcherId);

		if (selectedWatcher?.id === watcherId) {
			if (watchers.length > 0) {
				selectedWatcher = watchers[0];
			} else {
				selectedWatcher = undefined;
			}
		}
		createToast('Watcher deleted successfully');
	}

	function openWatcherCreation() {
		isCreatingWatcher = true;
		showModal = true;
		modalWatcherUrl = '';
		requestInterval = REQUEST_INTERVAL_DEFAULT;
		itemsPerRequest = ITEMS_PER_REQUEST_DEFAULT;
		inactivityTimeout = INACTIVITY_TIMEOUT_DEFAULT;
	}

	function openWatcherEdit(watcher: Watcher) {
		isCreatingWatcher = false;
		showModal = true;
		modalWatcherUrl = watcher.url;
		isUrlValid = true;
		requestInterval = watcher.requestInterval;
		itemsPerRequest = watcher.itemsPerRequest;
		inactivityTimeout = watcher.inactivityTimeout;
	}

	async function createWatcher() {
		if (!isUrlValid) return;

		const newWatcher = await HttpService.post<Watcher>(`/watchers`, {
			url: modalWatcherUrl,
			requestInterval,
			inactivityTimeout,
			itemsPerRequest
		});

		watchers = [...watchers, newWatcher];
		selectedWatcher = newWatcher;
		showModal = false;
		createToast('Watcher created successfully');
	}

	async function updateWatcher() {
		if (!isUrlValid) return;

		const updatedWatcher = await HttpService.put<Watcher>(`/watchers/${selectedWatcher?.id}`, {
			requestInterval,
			inactivityTimeout,
			itemsPerRequest
		});

		watchers = watchers.map((watcher) => {
			if (watcher.id === updatedWatcher.id) {
				watcher.url = updatedWatcher.url;
				watcher.requestInterval = updatedWatcher.requestInterval;
				watcher.inactivityTimeout = updatedWatcher.inactivityTimeout;
				watcher.itemsPerRequest = updatedWatcher.itemsPerRequest;
				watcher.itemsDownloaded = updatedWatcher.itemsDownloaded;
				watcher.totalItems = updatedWatcher.totalItems;
				watcher.lastRequestedAt = updatedWatcher.lastRequestedAt;
				watcher.status = updatedWatcher.status;
			}
			return watcher;
		});
		showModal = false;
		createToast('Watcher updated successfully');
	}

	async function pauseWatcher(watcherId: string) {
		await HttpService.patch(`/watchers/${watcherId}/pause`);
		watchers = watchers.map((watcher) => {
			if (watcher.id === watcherId) {
				watcher.status = 'paused';
			}
			return watcher;
		});
		createToast('Watcher paused successfully');
	}

	async function resumeWatcher(watcherId: string) {
		await HttpService.patch(`/watchers/${watcherId}/resume`);
		watchers = watchers.map((watcher) => {
			if (watcher.id === watcherId) {
				watcher.status = 'running';
			}
			return watcher;
		});
		createToast('Watcher resumed successfully');
	}

	function validateUrl(): void {
		const match = modalWatcherUrl.match(
			/boards.4chan.org\/(.+)\/thread\/(.+)|(old|www).reddit.com\/r\/(.+)/g
		);
		if (match && match.length > 0) {
			isUrlValid = true;
		} else {
			isUrlValid = false;
		}
	}

	$effect(() => {
		HttpService.get<{ watchers: Watcher[] }>(`/watchers`).then(async (res) => {
			watchers = res.watchers;

			if (watchers.length > 0) {
				selectedWatcher = watchers[0];
			}
		});

		wsUnsubscriber = socketEvents$.subscribe((event) => {
			if (event) {
				onSocketEvent(event);
			}
		});
	});

	onDestroy(() => {
		if (wsUnsubscriber) {
			wsUnsubscriber();
		}
	});
	async function onSocketEvent(wsEvent: WebSocketEvent) {
		if (wsEvent.event === 'watcher-update' && refreshGallery) {
			const watcherUpdateEvent = wsEvent.data as WatcherUpdateSocketEvent;
			const updatedWatcher = await HttpService.get<Watcher>(`/watchers/${watcherUpdateEvent.id}`);
			console.log('event for watcher', watcherUpdateEvent.id);
			watchers = watchers.map((watcher) => {
				if (watcher.id === updatedWatcher.id) {
					watcher.url = updatedWatcher.url;
					watcher.requestInterval = updatedWatcher.requestInterval;
					watcher.inactivityTimeout = updatedWatcher.inactivityTimeout;
					watcher.itemsPerRequest = updatedWatcher.itemsPerRequest;
					watcher.itemsDownloaded = updatedWatcher.itemsDownloaded;
					watcher.totalItems = updatedWatcher.totalItems;
					watcher.lastRequestedAt = updatedWatcher.lastRequestedAt;
					watcher.status = updatedWatcher.status;
				}
				return watcher;
			});

			await refreshGallery();
		}
	}
</script>

<div class=" bg-zinc-900 rounded-md h-full p-4">
	<div class="flex h-full">
		<div class="flex flex-[0.5] flex-col gap-4 border-r-2 border-red-950 pr-2 top-0">
			<div class="flex justify-between items-center">
				<div class="text-xl">Page Watchers</div>
				<Button onClick={openWatcherCreation}>New</Button>
			</div>
			{#if watchers.length > 0}
				<div class="flex flex-col gap-2 overflow-scroll">
					{#each watchers as watcher}
						<button
							class={`${watcher.id === selectedWatcher?.id ? 'bg-red-950' : 'hover:bg-red-900 transition-all'} flex p-4`}
							on:click={() => (selectedWatcher = watcher)}
						>
							<div class="w-full">
								<div class="flex justify-between w-full items-center">
									<div>{watcher.url}</div>
									<Link
										isSelected={watcher.id === selectedWatcher?.id}
										href={watcher.url}
										target="_blank"><LinkIcon /></Link
									>
								</div>
								<div class="flex justify-between flex-1 items-center">
									<div class="flex gap-2">
										<div>Updated at</div>
										<div>{new Date(watcher.lastRequestedAt).toLocaleString()}</div>
									</div>
									<div class="flex gap-2">
										<div>{watcher.status}</div>
										<div>
											{watcher.itemsDownloaded} / {watcher.totalItems}
										</div>
									</div>
								</div>
								<div class="flex gap-2">
									<Button
										isSelected={watcher.id === selectedWatcher?.id}
										disabled={watcher.status === 'finished' || watcher.status === 'dead'}
										onClick={() =>
											watcher.status === 'paused'
												? resumeWatcher(watcher.id)
												: pauseWatcher(watcher.id)}
									>
										{#if watcher.status === 'running'}
											<PauseIcon />
										{:else}
											<PlayIcon />
										{/if}
									</Button>
									<Button
										disabled={watcher.status === 'finished' || watcher.status === 'dead'}
										isSelected={watcher.id === selectedWatcher?.id}
										onClick={() => openWatcherEdit(watcher)}
									>
										<PenIcon />
									</Button>
									<Button
										isSelected={watcher.id === selectedWatcher?.id}
										onClick={() => deleteWatcher(watcher.id)}><TrashIcon /></Button
									>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="text-4xl">No watchers found</div>
			{/if}
		</div>
		{#if selectedWatcher}
			<div class="flex flex-1 flex-col pl-2">
				<div class="text-xl flex items-center h-[40px]">Downloaded Items</div>
				<Gallery
					bind:refreshGallery
					watcherId={selectedWatcher.id}
					usesQueryParams={false}
					showFilterButton={false}
					showReviewButton={false}
				/>
			</div>
		{/if}
	</div>
</div>

<Modal bind:showModal>
	<div class="flex flex-col flex-1 p-4">
		<LabeledComponent>
			<div slot="label">Watcher URL</div>
			<div slot="content" class="flex flex-col gap-2">
				<TextInput
					disabled={!isCreatingWatcher}
					bind:value={modalWatcherUrl}
					on:input={validateUrl}
				/>
				{#if modalWatcherUrl.length > 0}
					{#if isUrlValid}
						<div class="text-green-800">Valid URL</div>
					{:else}
						<div class="text-red-900">Invalid URL</div>
					{/if}
				{/if}
			</div>
		</LabeledComponent>
		<LabeledComponent>
			<div slot="label">Items per request</div>
			<div slot="content">
				<NumberInput bind:value={itemsPerRequest} />
			</div>
		</LabeledComponent>
		<LabeledComponent>
			<div slot="label">Request Interval</div>
			<div slot="content">
				<DurationPicker bind:value={requestInterval} timeScale="seconds" />
			</div>
		</LabeledComponent>
		<LabeledComponent>
			<div slot="label">Request Inactivity Timeout</div>
			<div slot="content">
				<DurationPicker bind:value={inactivityTimeout} timeScale="hours" />
			</div>
		</LabeledComponent>
		{#if isCreatingWatcher}
			<Button onClick={createWatcher}>Create</Button>
		{:else}
			<Button onClick={updateWatcher}>Update</Button>
		{/if}
		<div>
			<div>Supported sites:</div>
			<div class="flex flex-col gap-2">
				<div>4chan threads</div>
				<div>Reddit subreddits</div>
			</div>
		</div>
	</div>
</Modal>
