<script lang="ts">
	export { cssClass as class };
	let cssClass = '';

	export let value: string = '';
</script>

<select
	bind:value
	class={` bg-surface-color border-red-950 border-2 rounded-md shadow-xl pl-2 ${cssClass}`}
>
	<slot />
</select>
