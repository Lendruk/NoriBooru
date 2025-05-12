<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { MediaItem } from '$lib/types/MediaItem';
	import { TrashIcon } from '@lendruk/personal-svelte-ui-lib';
	import GalleryItemButton from '../../../gallery/GalleryItemButton.svelte';

	export let resources: { name: string; id: string; previewMediaItem?: Partial<MediaItem> }[];
	export let selectedResourceId: string | undefined = undefined;

	export let onResourceClick: (resource: any) => void | Promise<void>;
	export let onResourceDeleteClick: (
		resourceId: string,
		resourceName: string
	) => void | Promise<void>;
</script>

<div class="flex gap-4 flex-wrap">
	{#each resources as resource}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			on:click={() => onResourceClick(resource)}
			class={`w-[150px] h-[200px] ${selectedResourceId === resource.id ? 'border-4 ' : ''} bg-zinc-950 bg-cover bg-no-repeat relative break-words rounded-sm border-red-950 hover:border-4  hover:transition-all`}
			style={resource.previewMediaItem
				? `background-image: url(${HttpService.buildGetImageUrl(resource.previewMediaItem.fileName!, 'png')})`
				: ''}
		>
			{resource.name}
			<GalleryItemButton
				onClick={(e) => {
					e.stopPropagation();
					onResourceDeleteClick(resource.id, resource.name);
				}}
				class="absolute bottom-2 right-2"
			>
				<TrashIcon />
			</GalleryItemButton>
		</div>
	{/each}
</div>
