<script lang="ts">
	export let value: string;
	export let placeholder: string | undefined = undefined;
</script>

<textarea
	class="focus:outline-none bg-surface-color border-red-950 pl-2 border-2 rounded-md shadow-xl"
	bind:value
	{placeholder}
></textarea>
