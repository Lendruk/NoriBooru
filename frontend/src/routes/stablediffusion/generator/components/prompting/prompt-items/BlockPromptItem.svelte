<script lang="ts">
	import { XIcon } from "@lendruk/personal-svelte-ui-lib";
	
  let { headerText, headerBackgroundColor, onDelete } = $props<{
    headerText: string;
    headerBackgroundColor?: string;
    onDelete: () => void;
  }>();
</script>

<div class="flex flex-col min-w-[80px] max-w-fit" >
  <div style={`${headerBackgroundColor ? `background-color:${headerBackgroundColor}` : ''}`} class="flex flex-row flex-1 text-sm p-1 bg-blue-900 justify-between w-[80%] items-center rounded-t-md fill-white">
    <div>{headerText}</div>
    <button onclick={onDelete}>
      <XIcon width={12} height={12} />
    </button>
  </div>
 <slot />
</div>