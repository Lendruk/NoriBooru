<script lang="ts">
	import { onMount } from 'svelte';
	export let content = '';
	export let visible = false;
	export let automaticMode = true;
	export let x = 0;
	export let y = 0;

	let contentDiv: HTMLElement;
	let toolTipDiv: HTMLDivElement;

	function onMouseEnter() {
		visible = true;
		x = contentDiv.offsetLeft - toolTipDiv.clientWidth;
		y = contentDiv.offsetTop + 15;
	}

	function onMouseLeave() {
		visible = false;
	}

	onMount(() => {
		if (automaticMode) {
			contentDiv = toolTipDiv.nextSibling?.nextSibling as HTMLElement;
			contentDiv.addEventListener('mouseenter', onMouseEnter);
			contentDiv.addEventListener('mouseleave', onMouseLeave);
		}
	});
</script>

<div
	bind:this={toolTipDiv}
	style={`top:${y}px; left:${x}px`}
	class={`absolute p-4 min-h-[30px] flex-1 bg-red-950 bg-opacity-90 border-2 transition duration-300 min-w-[80px] border-red-900 justify-center rounded-lg ${
		!visible ? 'invisible' : 'flex'
	} items-center`}
>
	{content}
	<slot name="toolTipContent" />
</div>
<slot name="target" />
