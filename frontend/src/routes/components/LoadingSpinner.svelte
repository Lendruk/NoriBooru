<script lang="ts">
	import loadingSpinner from '$lib/assets/tail-spin.svg';
	export let width = 45;
	export let height = 45;
</script>

<img style={`width:${width}px;height:${height}px;`} src={loadingSpinner} alt="spinner" />
