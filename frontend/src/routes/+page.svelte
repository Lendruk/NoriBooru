<script lang="ts">
	import Button from "$lib/Button.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import UploadIcon from "$lib/icons/UploadIcon.svelte";
  import { HttpService } from "$lib/services/HttpService";
	import GalleryItemButton from "./gallery/GalleryItemButton.svelte";
  let previewFiles: { name: string, URL: string, originalFile: File }[] = $state([]);

  type InputEvent = Event & {
    currentTarget: EventTarget & HTMLInputElement;
  };

  async function uploadMedia() {
    if (previewFiles.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < previewFiles.length; i++) {
        formData.append(`image-${i}`, previewFiles[i].originalFile);
      }

      const result = await HttpService.post("/mediaItems", formData);
      previewFiles = [];
    }
  }

  function createPreviewImages(event: InputEvent) {
    const newPreviews = Array.from(event.currentTarget!.files!).map((image: File) => {
      console.log(image);
        return {
            name: image.name,
            URL: URL.createObjectURL(image),
            originalFile: image,
        };
    });
    previewFiles = previewFiles.concat(newPreviews);
  }

  function removeImage(index: number): void {
    previewFiles.splice(index, 1);
  }

</script>
  <div class="bg-zinc-900 m-2 p-2 rounded-md max-h-full">
    <h2>Media Upload</h2>
    <div class="flex">
      <div class="flex shrink flex-1">
        <div class="flex flex-grow flex-col mt-40 mb-40 justify-center items-center gap-4">
          <UploadIcon />
          <label class="hover:bg-red-900 bg-red-950 hover:transition cursor-pointer height-[40px] min-w-[150px] p-2 rounded-md flex justify-center" for="fileUpload">
            Browse
          </label>
        </div>
        <input id="fileUpload" class="hidden" type="file" on:change={createPreviewImages} multiple>
      </div>
      {#if previewFiles.length > 0}
      <div class="flex flex-col grow-[2]">
        <div class="grid w-full gap-2 justify-center p-4 overflow-scroll" style={`grid-template-columns: repeat(auto-fit, minmax(208px, 1fr));`}>
          {#each previewFiles as file, i (i)}
            <div class="flex max-h-[500px] max-w-[300px] flex-col text-xs text-red-900 relative">
              <div class="absolute top-0 flex flex-1 justify-end w-full h-full p-2">
                  <GalleryItemButton onClick={() => removeImage(i)}>
                    <TrashIcon />
                  </GalleryItemButton>
              </div>
              {#if file.originalFile.type.includes("video")} 
                <video src={file.URL} controls/>
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