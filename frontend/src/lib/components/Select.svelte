<script lang="ts">
	export { cssClass as class };
	let cssClass = '';

	export let value: string = '';
</script>

<select bind:value class={`text-black ${cssClass}`}>
	<slot />
</select>
