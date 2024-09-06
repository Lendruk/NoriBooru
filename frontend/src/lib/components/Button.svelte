<script lang="ts">
	export let onClick = () => {};

	export let isSelected = false;
	export let disabled = false;
	let className = '';
	export { className as class };

	function formatClasses(): string {
		if (isSelected) {
			if (disabled) {
				return 'bg-zinc-900 cursor-not-allowed text-red-950';
			}
			return 'bg-zinc-900';
		}

		if (disabled) {
			return 'fill-zinc-900 cursor-not-allowed text-red-950';
		}

		return '';
	}
</script>

<button
	class={`flex text-center justify-center items-center rounded-md pl-4 pr-4 h-[40px] fill-white bg-red-950 text-white hover:bg-red-800 hover:transition ${className} ${formatClasses()}`}
	on:click={() => {
		if (!disabled) onClick();
	}}><slot /></button
>
