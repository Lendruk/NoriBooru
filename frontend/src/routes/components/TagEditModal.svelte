<script lang="ts">
	import Modal from "$lib/Modal.svelte";
	import TagSearchInput from "$lib/TagSearchInput.svelte";
	import type { PopulatedTag } from "$lib/types/PopulatedTag";

  export let showModal = false;

  export let appliedTags: PopulatedTag[] = [];
  export let availableTags: PopulatedTag[] = [];
  export let ignoredTags: PopulatedTag[] = [];

  export let onTagSearchSubmit: (tag: PopulatedTag) => void | Promise<void>;
  export let onAppliedTagClick: (tag: PopulatedTag) => void | Promise<void>;

</script>
<Modal class="w-[40%]" bind:showModal={showModal}>
  <div class="p-4 flex flex-col w-full">
    <div class="text-xl mb-4">
      Modify media item tags
    </div>
      <TagSearchInput
        appliedTags={appliedTags}  
        availableTags={availableTags}
        ignoredTags={appliedTags}
        onTagSearchSubmit={onTagSearchSubmit}
        onAppliedTagClick={onAppliedTagClick}
        />
  </div>
</Modal>