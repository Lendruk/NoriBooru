<script lang="ts">
	import type { MouseEventHandler } from "svelte/elements";
	import EditIcon from "./icons/editIcon.svelte";

  export let text = '';
  export let mediaCount = 0;
  export let color = '#007bff';
  export let onDelete: MouseEventHandler<HTMLButtonElement> | undefined = undefined;
  export let onEdit: MouseEventHandler<HTMLButtonElement>  | undefined  = undefined;
  export let onClick: MouseEventHandler<HTMLSpanElement>  | undefined  = undefined;

  $: cssVarStyles = `--color: ${color}; cursor: ${onClick ? 'pointer' : 'default'}`;
</script>

<span on:click={onClick ?? undefined} style={cssVarStyles} class="tag"> 
  <slot>
    <button on:click={onEdit} class={`editButton ${!onEdit ? 'invisible': 'mr-2' }`}><EditIcon class="fill-white" /></button> {text} {mediaCount > 0 ? `(${mediaCount})` : ''}
    <button class={`delete ${!onDelete && 'invisible'}`} on:click={onDelete}> X </button>
  </slot>
</span>

<style>
  .tag {
    padding: 0.5em 1em;
    background-color: var(--color, #007bff);
    color: white;
    border-radius: 2em;
    text-align: center;
    max-height: 50px;

    display: flex;
    flex-direction: row;
  }

  .editButton {
    background-color: transparent;
    border: none;
    color: white;
    cursor: pointer;
  }

  .tag .delete {
    cursor: pointer;
    margin-left: 0.5em;
    background-color: transparent;
    border: none;
    color: white;
  }
</style>