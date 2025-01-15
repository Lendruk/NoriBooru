<script lang="ts">
	import Tag from '$lib/components/Tag.svelte';
	import TagSearchInput from '$lib/components/TagSearchInput.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import { Button, Modal } from '@lendruk/personal-svelte-ui-lib';
	let tagName = $state('');
	let tagColor = $state('#ffffff');
	let tagParentId = $state<number | undefined>(undefined);
	let appliedParent = $state<PopulatedTag[]>([]);
	let showTagEditModal = $state(false);
	let tagInEditName = $state('');
	let tagInEditColor = $state('#ffffff');
	let tagInEditAppliedParent = $state<PopulatedTag[]>([]);
	let tagInEditParent = $state<number | undefined>(undefined);
	let tagInEditId = $state(0);
	let tagInEditTypeId = $state(0);

	let tags: PopulatedTag[] = $state([]);

	$effect(() => {
		HttpService.get<PopulatedTag[]>(endpoints.tags()).then((res) => {
			tags = res;
		});
	});

	async function createTag() {
		const newTag = await HttpService.post<PopulatedTag>(endpoints.tags(), {
			name: tagName,
			color: tagColor,
			parentId: tagParentId
		});
		tags = [...tags, newTag];
		tagName = '';
		tagColor = '#ffffff';
		tagParentId = undefined;
		appliedParent = [];
	}

	async function updateTag() {
		const updatedTag = await HttpService.put<PopulatedTag>(endpoints.tag({ id: tagInEditId }), {
			name: tagInEditName,
			parentId: tagInEditParent,
			color: tagInEditColor
		});
		showTagEditModal = false;
		// updatedTag.tagType = tagTypes.find((tagType) => tagType.id === updatedTag.tagType?.id)!;
		tags = tags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag));
		tagInEditId = 0;
		tagInEditName = '';
		tagInEditTypeId = 0;
	}

	async function deleteTag(id: number) {
		await HttpService.delete(endpoints.tag({ id }));
		tags = tags.filter((tag) => tag.id !== id);
	}
</script>

<div class="flex gap-2 h-full">
	<div class="flex flex-col h-fit max-h-full flex-1 bg-zinc-900 p-4">
		<h2 class="text-2xl mb-4">Add Tag</h2>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-4">
				<label for="name">Tag name</label>
				<input
					name="name"
					type="text"
					bind:value={tagName}
					placeholder="Tag Name"
					class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"
				/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagType">Parent</label>
				<TagSearchInput
					availableTags={tags}
					limit={1}
					appliedTags={appliedParent}
					createOnEnter={false}
					onAppliedTagClick={() => {
						tagParentId = undefined;
						appliedParent = [];
					}}
					onTagSearchSubmit={(tag) => {
						appliedParent = [tag];
						tagParentId = tag.id;
						tagColor = tag.color;
					}}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagColor">Color</label>
				<input
					name="tagColor"
					type="color"
					bind:value={tagColor}
					class="h-[40px] bg-zinc-800 indent-2"
				/>
			</div>
			<Button
				class="bg-red-950 hover:bg-red-800 h-[40px]"
				onClick={() => tagName.length > 0 && createTag()}>Add</Button
			>
		</div>
		<h2 class="text-2xl mb-2 mt-10">Tags</h2>
		<div class="h-[1px] border-t-2 border-red-950 w-[80%] flex mt-2 mb-10"></div>
		<div class="flex flex-wrap gap-3">
			{#each tags as tag}
				<Tag
					onEdit={() => {
						showTagEditModal = true;
						tagInEditName = tag.name;
						tagInEditId = tag.id;
						tagInEditColor = tag.color;
						tagInEditAppliedParent = tag.parent ? [tag.parent as PopulatedTag] : []
					}}
					{tag}
					onDelete={() => deleteTag(tag.id)}
				/>
			{/each}
		</div>
	</div>
</div>

<Modal bind:showModal={showTagEditModal}>
	{#if tagInEditName}
		<div class="flex flex-1 flex-col justify-center m-4 gap-4">
			<div class="flex flex-col gap-4">
				<label for="tagEditName">Tag name</label>
				<input
					name="tagEditName"
					type="text"
					bind:value={tagInEditName}
					placeholder="Tag Name"
					class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"
				/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagType">Parent</label>
				<TagSearchInput
					availableTags={tags}
					limit={1}
					appliedTags={tagInEditAppliedParent}
					onAppliedTagClick={() => {
						tagInEditParent = undefined;
						tagInEditAppliedParent = [];
					}}
					onTagSearchSubmit={(tag) => {
						tagInEditAppliedParent = [tag];
						tagInEditParent = tag.id;
					}}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagColor">Color</label>
				<input
					name="tagColor"
					type="color"
					bind:value={tagInEditColor}
					class="h-[40px] bg-zinc-800 indent-2"
				/>
			</div>
			<Button
				class="bg-red-950 hover:bg-red-800 h-[40px]"
				onClick={() => tagInEditName.length > 0 && updateTag()}>Save</Button
			>
		</div>
	{/if}
</Modal>

<svelte:head>
	<title>NoriBooru - Tags</title>
</svelte:head>
