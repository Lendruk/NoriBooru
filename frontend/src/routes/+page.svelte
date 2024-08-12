<script lang="ts">
	import Button from '$lib/Button.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import UploadIcon from '$lib/icons/UploadIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { JobWebsocketEventData } from '$lib/services/WebsocketService';
	import GalleryItemButton from './gallery/GalleryItemButton.svelte';
	let previewFiles: { name: string; URL: string; originalFile: File }[] = $state([]);

	type InputEvent = Event & {
		currentTarget: EventTarget & HTMLInputElement;
	};

	type MediaUploadJobUpdatePayload = {
		totalFiles: number;
		currentFileIndex: number;
		currentFileName: string;
	};

	async function uploadMedia() {
		if (previewFiles.length > 0) {
			const formData = new FormData();
			formData.append('totalItems', previewFiles.length.toString());
			for (let i = 0; i < previewFiles.length; i++) {
				formData.append(`image-${i}`, previewFiles[i].originalFile);
			}

			const handler = await HttpService.postJob<JobWebsocketEventData<MediaUploadJobUpdatePayload>>(
				'/mediaItems',
				formData
			);

			handler.subscribe((data) => {
				if (data.event === 'job-done') {
					createToast('Media uploaded successfully!');
				}
			});
			createToast('Request created successfully!');
			previewFiles = [];
		}
	}

	function createPreviewImages(event: InputEvent) {
		const newPreviews = Array.from(event.currentTarget!.files!).map((image: File) => {
			console.log(image);
			return {
				name: image.name,
				URL: URL.createObjectURL(image),
				originalFile: image
			};
		});
		previewFiles = previewFiles.concat(newPreviews);
	}

	function removeImage(index: number): void {
		previewFiles.splice(index, 1);
	}
</script>

<div class="bg-zinc-900 p-2 rounded-md h-full flex flex-col items-center justify-center">
	<div class="flex flex-1 w-full items-center justify-center">
		<div class="flex shrink flex-1 h-full">
			<div class="flex flex-grow flex-col mt-40 mb-40 justify-center items-center gap-4">
				<div class="text-3xl">Media Upload</div>
				<UploadIcon />
				<label
					class="hover:bg-red-900 bg-red-950 hover:transition cursor-pointer height-[40px] min-w-[150px] p-2 rounded-md flex justify-center"
					for="fileUpload"
				>
					Browse
				</label>
			</div>
			<input id="fileUpload" class="hidden" type="file" on:change={createPreviewImages} multiple />
		</div>
		{#if previewFiles.length > 0}
			<div class="flex flex-col grow-[2]">
				<div
					class="grid w-full gap-2 justify-center p-4 overflow-scroll"
					style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}
				>
					{#each previewFiles as file, i (i)}
						<div class="flex max-h-[500px] max-w-[300px] flex-col text-xs text-red-900 relative">
							<div class="absolute top-0 flex flex-1 justify-end w-full h-full p-2">
								<GalleryItemButton onClick={() => removeImage(i)}>
									<TrashIcon />
								</GalleryItemButton>
							</div>
							{#if file.originalFile.type.includes('video')}
								<video src={file.URL} controls />
							{:else}
								<img src={file.URL} alt={file.name} />
							{/if}
							<div>{file.name}</div>
						</div>
					{/each}
				</div>
				<Button class="h-[40px]" onClick={uploadMedia}>Upload Media</Button>
			</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru - Upload</title>
</svelte:head>
