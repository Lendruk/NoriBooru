<script lang="ts">
	export let onClick = (
		event: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => {};
	export { cssClasses as class };
	let cssClasses = '';

	export let width = 35;
	export let height = 35;

	export let onMouseEnter: () => void = () => {};
</script>

<button
	class={`flex fill-white justify-center place-items-center items-center rounded-full bg-red-900 hover:bg-red-800 ${cssClasses ?? ''}`}
	style={` width: ${width}px; height: ${height}px;`}
	on:mouseenter={onMouseEnter}
	on:click={(e) => {
		e.preventDefault();
		onClick(e);
	}}
>
	<slot />
</button>
