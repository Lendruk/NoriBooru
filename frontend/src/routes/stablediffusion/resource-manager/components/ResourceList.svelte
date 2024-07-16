<script lang="ts">
	export let resources: { name: string; id: string; previewImage?: string }[];
	export let selectedResourceId: string | undefined = undefined;

	export let onResourceClick: (resource: any) => void | Promise<void>;
</script>

<div class="flex gap-4 flex-wrap">
	{#each resources as resource}
		<button
			on:click={() => onResourceClick(resource)}
			class={`w-[150px] h-[200px] ${selectedResourceId === resource.id ? 'border-4 ' : ''} bg-zinc-950 break-words rounded-sm border-red-950 hover:border-4  hover:transition-all`}
		>
			{resource.name}
		</button>
	{/each}
</div>
