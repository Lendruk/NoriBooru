<script lang="ts">
	export { cssClass as class };
	export let isChecked = false;
	let cssClass = '';
</script>

<button
	on:click={() => (isChecked = !isChecked)}
	class={`flex gap-2 items-center bg-zinc-950 w-fit p-2 rounded-md hover:bg-zinc-800 hover:transition ${cssClass}`}
>
	<input type="checkbox" bind:checked={isChecked} />
	<span>Randomize order</span>
</button>
