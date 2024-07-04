<script lang="ts">
	export let onClick = () => {};
	let className = '';
	export { className as class };
</script>

<button
	class={`flex text-center justify-center items-center rounded-md pl-4 pr-4 bg-red-950 text-white hover:bg-red-800 hover:transition ${className}`}
	on:click={onClick}><slot /></button
>
