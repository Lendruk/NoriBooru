<script lang="ts">
	export let content = '';
	export let visible = false;

	export let x = 0;
	export let y = 0;
</script>

<div
	style={`top:${y - 15}px; left:${x - 90}px`}
	class={`absolute p-4 h-[30px] bg-red-950 bg-opacity-90 border-2 transition duration-300 min-w-[80px] border-red-900 justify-center rounded-lg ${
		!visible ? 'hidden' : 'flex'
	} items-center`}
>
	{content}
</div>
