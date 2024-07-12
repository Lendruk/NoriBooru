<script lang="ts">
	export let resources: { name: string; previewImage?: string }[];
</script>

<div>
	<div class="flex gap-4 flex-wrap">
		{#each resources as resource}
			<div>
				{resource.name}
			</div>
		{/each}
	</div>
</div>
