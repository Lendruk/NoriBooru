<script lang="ts">
	import type { Snippet } from "svelte";
	let { children, top = $bindable(0), left = $bindable(0), isContextMenuOpen = $bindable(false) }: {
		children: Snippet;
		top: number;
		left: number;
		isContextMenuOpen: boolean;
	} = $props(); 
</script>

<div
	style={`top:${top}px;left:${left}px`}
	class={`bg-zinc-900 absolute ${isContextMenuOpen ? 'flex' : 'hidden'} flex-col `}
>
	{@render children()}
</div>
