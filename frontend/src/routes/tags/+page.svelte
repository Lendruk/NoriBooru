<script lang="ts">
	import Button from '$lib/Button.svelte';
import Modal from '$lib/Modal.svelte';
	import Tag from '$lib/Tag.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { TagDef } from '$lib/types/TagDef';
	import type { TagType } from '$lib/types/TagType';
	let tagName = $state('');
	let tagTypeName = $state('');
	let tagTypeColor = $state('#ffffff');
	let selectedTagType = $state(0);
	let showTagEditModal = $state(false);
	let tagInEditName = $state('');
	let tagInEditId = $state(0);
	let tagInEditTypeId = $state(0);

	let showTagTypeEditModal = $state(false);
	let tagTypeInEditId = $state(0);
	let tagTypeInEditName = $state('');
	let tagTypeInEditColor = $state('');

	let tags: TagDef[] = $state([]);
	let tagTypes: TagType[] = $state([]);

	$effect(() => {
		HttpService.get<TagDef[]>('/tags').then((res) => {
			tags = res;
		});
		HttpService.get<TagType[]>('/tagTypes').then((res) => {
			tagTypes = res;
			selectedTagType = tagTypes[0]?.id ?? 0;
		});
	});

	async function createTag() {
		const newTag = await HttpService.post<TagDef>('/tags', {
			name: tagName,
			tagTypeId: selectedTagType
		});
		newTag.tagType = tagTypes.find((tagType) => tagType.id === selectedTagType)!;
		tags = [...tags, newTag];
		tagName = '';
		// selectedTagType = 0;
	}

	async function updateTag() {
		const updatedTag = await HttpService.put<TagDef>(`/tags/${tagInEditId}`, {
			name: tagInEditName,
			tagTypeId: tagInEditTypeId
		});
		showTagEditModal = false;
		updatedTag.tagType = tagTypes.find((tagType) => tagType.id === updatedTag.tagType?.id)!;
		tags = tags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag));
		tagInEditId = 0;
		tagInEditName = '';
		tagInEditTypeId = 0;
	}
	
	async function updateTagType() {
		const updatedTagType = await HttpService.put<TagType>(`/tagTypes/${tagTypeInEditId}`, {
			name: tagTypeInEditName,
			color: tagTypeInEditColor
		});
		showTagTypeEditModal = false;
		tagTypes = tagTypes.map((tagType) => (tagType.id === updatedTagType.id ? updatedTagType : tagType));
		tagTypeInEditColor = '';
		tagTypeInEditId = 0;
		tagTypeInEditName = '';
	}

	async function createTagType() {
		const newTagType = await HttpService.post<TagType>('/tagTypes', {
			name: tagTypeName,
			color: tagTypeColor
		});
		tagTypes = [...tagTypes, newTagType];
		tagTypeName = '';
		tagTypeColor = '';
	}

	async function deleteTag(id: number) {
		await HttpService.delete(`/tags/${id}`);
		tags = tags.filter((tag) => tag.id !== id);
	}

	async function deleteTagType(id: number) {
		await HttpService.delete(`/tagTypes/${id}`);
		tagTypes = tagTypes.filter((tag) => tag.id !== id);
	}
</script>

<div class="flex m-2 gap-2 h-full">
	<div class="flex flex-col h-fit max-h-full w-1/2 bg-zinc-900 p-4">
		<h2 class="text-2xl mb-4">Add Tag</h2>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-4">
				<label for="name">Tag name</label>
				<input name="name" type="text" bind:value={tagName} placeholder="Tag Name" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagType">Tag Type</label>
				<select name="tagType" bind:value={selectedTagType} class="h-[40px] bg-zinc-800 indent-2 rounded-md">
					{#each tagTypes as tagType}
						<option value={tagType.id}>{tagType.name}</option>
					{/each}
				</select>
			</div>
			<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={() => tagName.length > 0 && createTag()}>Add</Button>
		</div>
		<h2 class="text-2xl mb-2 mt-10">Tags</h2>
		<div class="h-[1px] border-t-2 border-red-950 w-[80%] flex mt-2 mb-10"></div>
		<div class="flex flex-wrap gap-3">
			{#each tags as tag}
				<Tag
					mediaCount={tag.mediaCount}
					onEdit={() => {
						showTagEditModal = true;
						tagInEditName = tag.name;
						tagInEditId = tag.id;
						tagInEditTypeId = tag.tagType?.id ?? 0;
					}}
					color={tag.tagType?.color}
					text={tag.name}
					onDelete={() => deleteTag(tag.id)}
				/>
			{/each}
		</div>
	</div>

	<div class="flex h-fit flex-col w-1/2 bg-zinc-900 p-4">
		<h2 class="text-2xl mb-4">Add Tag Type</h2>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-4">
				<label for="tagTypeName">Tag type name</label>
				<input name="tagTypeName" type="text" bind:value={tagTypeName} placeholder="Tag type name" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md" />
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagTypeColor">Color</label>
				<input name="tagTypeColor" type="color" bind:value={tagTypeColor} class="h-[40px] bg-zinc-800 indent-2" />
			</div>
			<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={() => tagTypeName.length > 0 && createTagType()}>Add</Button>
		</div>
		<div>
			<h2 class="text-2xl mb-2 mt-10">Tag Types</h2>
			<div class="h-[1px] border-t-2 border-red-950 w-[80%] flex mt-2 mb-10"></div>
			<div class="flex flex-wrap gap-3">
				{#each tagTypes as tagType}
					<Tag color={tagType.color} text={tagType.name} onEdit={() => {
						showTagTypeEditModal = true;
						tagTypeInEditName = tagType.name;
						tagTypeInEditColor = tagType.color;
						tagTypeInEditId = tagType.id;
					}} onDelete={() => deleteTagType(tagType.id)} />
				{/each}
			</div>
		</div>
	</div>
</div>

<Modal bind:showModal={showTagEditModal}>
	{#if tagInEditName}
		<div class="flex flex-1 flex-col justify-center m-4 gap-4">
			<div class="flex flex-col gap-4">
				<label for="tagEditName">Tag name</label>
				<input name="tagEditName" type="text" bind:value={tagInEditName} placeholder="Tag Name" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagType">Tag Type</label>
				<select name="tagType" bind:value={tagInEditTypeId} class="h-[40px] bg-zinc-800 indent-2 rounded-md">
					{#each tagTypes as tagType}
						<option value={tagType.id}>{tagType.name}</option>
					{/each}
				</select>
			</div>
			<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={() => tagInEditName.length > 0 && updateTag()}>Save</Button>
		</div>
	{/if}
</Modal>

<Modal bind:showModal={showTagTypeEditModal}>
	{#if tagTypeInEditName}
		<div class="flex flex-1 flex-col justify-center m-4 gap-4">
			<div class="flex flex-col gap-4">
				<label for="tagEditName">Tag type name</label>
				<input name="tagEditName" type="text" bind:value={tagTypeInEditName} placeholder="Tag type Name" class="outline-none h-[40px] indent-2 bg-zinc-800 rounded-md"/>
			</div>
			<div class="flex flex-col gap-4">
				<label for="tagTypeEditColor">Color</label>
				<input name="tagTypeEditColor" type="color" bind:value={tagTypeInEditColor} class="h-[40px] bg-zinc-800 indent-2" />
			</div>
			<Button class="bg-red-950 hover:bg-red-800 h-[40px]" onClick={() => tagTypeInEditName.length > 0 && updateTagType()}>Save</Button>
		</div>
	{/if}
</Modal>

<svelte:head>
	<title>NoriBooru - Tags</title>
</svelte:head>