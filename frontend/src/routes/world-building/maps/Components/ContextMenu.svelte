<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	let {
		isContextMenuOpen = $bindable(false),
		onNewPinClick = $bindable(() => {}),
		top = $bindable(0),
		left = $bindable(0)
	}: {
		isContextMenuOpen: boolean;
		onNewPinClick: () => void;
		top: number;
		left: number;
	} = $props();
</script>

<div
	style={`top:${top}px;left:${left}px`}
	class={`bg-zinc-900 absolute ${isContextMenuOpen ? 'flex' : 'hidden'} flex-col `}
>
	Context Menu
	<Button onClick={onNewPinClick}>PIN ALTA!!</Button>
</div>
