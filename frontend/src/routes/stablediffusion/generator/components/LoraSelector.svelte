<script lang="ts">
	import ImageIcon from "$lib/icons/ImageIcon.svelte";
import SettingsIcon from "$lib/icons/SettingsIcon.svelte";
	import UploadIcon from "$lib/icons/UploadIcon.svelte";
	import Modal from "$lib/Modal.svelte";
	import TagSearchInput from "$lib/TagSearchInput.svelte";
	import type { MediaItem } from "$lib/types/MediaItem";
  import type { SDLora } from "$lib/types/SD/SDLora";
	import LabeledComponent from "../../../components/LabeledComponent.svelte";
	import GalleryItemButton from "../../../gallery/GalleryItemButton.svelte";
	import type { PopulatedTag } from "$lib/types/PopulatedTag";
	import { HttpService } from "$lib/services/HttpService";

  export let loras: SDLora[];
  export let onLoraClick: (lora: SDLora) => void;
  export let lastGen: Partial<MediaItem> | undefined;
  export let allTags: PopulatedTag[];

  let showLoraEditModal = false;
  let loraInEdit: SDLora | undefined;
  let activationWords: [string, number][] = [];

  function openLoraSettings(lora: SDLora) {
    showLoraEditModal = true;
    loraInEdit = lora;

    const key = Object.keys(loraInEdit.metadata.ss_tag_frequency)[0];
    const frequencyDict = loraInEdit.metadata.ss_tag_frequency[key]
    for(const tag in frequencyDict) {
      activationWords.push([tag, frequencyDict[tag]]);
    }

    activationWords.sort((a, b) => b[1] - a[1]);
  }

  async function setPreviewImage(lora: SDLora) {
    if (lastGen && loraInEdit) {
      await HttpService.put(`/sd/loras/${lora.id}`, {
        previewImage: lastGen.fileName,
      });
      loraInEdit.previewImage = lastGen.fileName!;
    }
  }

  async function addTagToLora(tag: PopulatedTag) {
    if (loraInEdit) {
      loraInEdit.tags = loraInEdit.tags.concat(tag);
      await HttpService.put(`/sd/loras/${loraInEdit.id}`, {
        tags: loraInEdit.tags.map(t => t.id),
      });
    }
  }

  async function removeTagFromLora(tag: PopulatedTag) {
    if (loraInEdit) {
      const index = loraInEdit.tags.findIndex(t => t.id === tag.id);
      loraInEdit.tags.splice(index, 1);
      loraInEdit.tags = loraInEdit.tags;
      await HttpService.put(`/sd/loras/${loraInEdit.id}`, {
        tags: loraInEdit.tags.map(t => t.id),
      });
    }
  }
</script>

<div>
  <div class="text-xl">
    Loras
  </div>
  <div class='flex flex-wrap gap-2'>
    {#each loras as lora}
      <button 
        style={`background-image: url(${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${lora.previewImage}.png);`} 
        on:click={() => onLoraClick(lora)} 
        class="w-[150px] h-[200px] bg-zinc-700 flex items-end justify-center relative bg-cover bg-no-repeat"
      >
        <div>{lora.name}</div>
        <div class="absolute top-1 right-1">
          <GalleryItemButton onClick={(e) => { e.stopPropagation(); openLoraSettings(lora)}}>
            <SettingsIcon />
          </GalleryItemButton>
        </div>
      </button>
    {/each}
  </div>
</div>
<Modal bind:showModal={showLoraEditModal}>
  {#if loraInEdit}
    <div class="p-4">
      <div class="text-xl">
        {loraInEdit.name}
      </div>
      <div class="flex gap-2">
        <div>
          <LabeledComponent>
            <div slot="label">
              Path
            </div>
            <div slot="content">
              {loraInEdit.path}
            </div>
          </LabeledComponent>
          <LabeledComponent>
            <div slot="label">
              Tags
            </div>
            <div slot="content">
              <TagSearchInput 
                onTagSearchSubmit={(tag) => addTagToLora(tag)}
                onAppliedTagClick={(tag) => removeTagFromLora(tag)}
                availableTags={allTags}
                ignoredTags={loraInEdit.tags}
                appliedTags={loraInEdit.tags}
              />
            </div>
          </LabeledComponent>
        </div>
        <div class="flex w-[150px] h-[250px] items-center relative justify-center bg-zinc-950">
          {#if loraInEdit.previewImage}
            <img src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${loraInEdit.previewImage}.png`} />
          {:else}
            <ImageIcon />
          {/if}
          <div class="absolute right-2 bottom-2">
            <GalleryItemButton onClick={() => setPreviewImage(loraInEdit!)}>
              <UploadIcon width={16} height={16} />
            </GalleryItemButton>
          </div>
        </div>
      </div>
      <LabeledComponent>
        <div slot="label">
          Activation Words
        </div>
        <div class="overflow-scroll max-h-[300px]" slot="content">
          {#each activationWords as activationPair}
            <div>
              {activationPair[0]} : {activationPair[1]}
            </div>
          {/each}
        </div>
      </LabeledComponent>
    </div>
  {/if}
</Modal>