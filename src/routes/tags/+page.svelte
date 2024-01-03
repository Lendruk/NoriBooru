
<script lang="ts"> 
	import Modal from '$lib/client/Modal.svelte';
	import Tag from '$lib/client/Tag.svelte';
	import { HttpService } from '$lib/client/services/HttpService';
  import type { Tag as TagDef, TagType } from '$lib/server/db/vault/schema';
  let tagName = $state("");
  let tagTypeName = $state("");
  let tagTypeColor = $state("#ffffff");
  let selectedTagType = $state(0);
  let showTagEditModal = $state(false);
  let tagInEditName = $state("");
  let tagInEditId = $state(0);
  let tagInEditTypeId = $state(0);
  let showTagTypeEditModal = $state(false);

  let tags: TagDef[] = $state([]);
  let tagTypes: TagType[] = $state([]);

  
  $effect(() => {
    HttpService.get<TagDef[]>("/api/tags").then((res) => {
      tags = res;
    });
    HttpService.get<TagType[]>("/api/tagTypes").then((res) => {
      tagTypes = res;
      selectedTagType = tagTypes[0]?.id ?? 0;
    });
  });

  async function createTag() {
    const newTag = await HttpService.post<TagDef>("/api/tags", { name: tagName, tagTypeId: selectedTagType });
    newTag.tagType = tagTypes.find(tagType => tagType.id === selectedTagType);
    tags = [...tags, newTag];
    tagName = "";
    // selectedTagType = 0;
  }

  async function updateTag() {
    const updatedTag = await HttpService.put<TagDef>(`/api/tags/${tagInEditId}`, { name: tagInEditName, tagTypeId: tagInEditTypeId });
    showTagEditModal = false;
      updatedTag.tagType = tagTypes.find(tagType => tagType.id === updatedTag.tagType?.id);
      tags = tags.map(tag => tag.id === updatedTag.id ? updatedTag : tag);
      tagInEditId = 0;
      tagInEditName = "";
      tagInEditTypeId = 0;
  }
  1
  async function createTagType() {
    const newTagType = await HttpService.post<TagType>("/api/tagTypes", { name: tagTypeName, color: tagTypeColor });
    tagTypes = [...tagTypes, newTagType];
    tagTypeName = "";
    tagTypeColor = "";
  }

  async function deleteTag(id: number) {
    await HttpService.delete(`/api/tags/${id}`);
    tags = tags.filter(tag => tag.id !== id);
  }

  async function deleteTagType(id: number) {
    await HttpService.delete(`/api/tagTypes/${id}`);
    tagTypes = tagTypes.filter(tag => tag.id !== id);
  }
</script>

<div>
  <div>
    <div>
      <p>Add Tag</p>
      <input name="name" type="text" bind:value={tagName} placeholder="Tag Name" />
      <select bind:value={selectedTagType}>
        {#each tagTypes as tagType}
          <option value={tagType.id}>{tagType.name}</option>
        {/each}
      </select>
      <button on:click={() => tagName.length > 0 && createTag()}>Add</button>
    </div>
    <div>
      <p>Add Tag Type</p>
      <input type="text" bind:value={tagTypeName} placeholder="Tag type name" />
      <input type="color" bind:value={tagTypeColor} />
      <button on:click={() => tagTypeName.length > 0 && createTagType()}>Add</button>
    </div>
  </div>

  <div>
    <p>Tags</p>
    <div class="tags">
      {#each tags as tag}
        <Tag mediaCount={tag.mediaCount}  onEdit={() => { showTagEditModal = true; tagInEditName = tag.name; tagInEditId = tag.id; tagInEditTypeId = tag.tagType?.id ?? 0 }} color={tag.tagType?.color} text={tag.name} onDelete={() => deleteTag(tag.id) } />
      {/each}
    </div>
  </div>

  <div>
    <p>Tag Types</p>
    <div class="tags">
      {#each tagTypes as tag}
        <Tag  color={tag.color} text={tag.name} onDelete={() => deleteTagType(tag.id) } />
      {/each}
    </div>
  </div>
</div>

<Modal bind:showModal={showTagEditModal} >
  <div slot="header">Edit Tag</div>
  {#if tagInEditName}
  <div>
    <input type="text" bind:value={tagInEditName} placeholder="Tag Name" />
    <select bind:value={tagInEditTypeId}>
      {#each tagTypes as tagType}
        <option value={tagType.id}>{tagType.name}</option>
      {/each}
    </select>
    <button on:click={() => tagInEditName.length > 0 && updateTag()}>Save</button>
  </div>
  {/if}
</Modal>

<style lang="postcss">
  .tags {
    display: flex;
    gap: 1em;
  }
</style>