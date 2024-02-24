<script lang="ts">
	export let onClick = () => {};
  let className = "";
  export { className as class};
</script>

<button
	class={`flex text-center justify-center items-center rounded-md pl-4 pr-4 bg-surface-color text-white hover:bg-gray-700 hover:transition ${className}`}
	on:click={onClick}><slot /></button
>
