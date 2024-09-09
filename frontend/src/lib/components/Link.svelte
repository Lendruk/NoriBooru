<script lang="ts">
	export { cssClass as class };
	let cssClass = '';
	export let isSelected = false;
	export let href: string;
	export let target: string | undefined = undefined;
</script>

<a
	{href}
	{target}
	class={`flex items-center justify-center rounded-md pt-2 pb-2 pl-4 pr-4 bg-red-950 text-white hover:bg-red-800 hover:transition ${cssClass} ${isSelected ? 'bg-zinc-900' : ''}`}
	><slot /></a
>
