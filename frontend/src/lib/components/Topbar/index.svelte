<script>
	import Breadcrumb from './Breadcrumb.svelte';
	import CurrentVault from './CurrentVault.svelte';
	import JobViewer from './JobViewer.svelte';
</script>

<div
	class="bg-zinc-900 gap-4 flex items-center h-[50px] rounded-md ml-2 mr-2 min-h-[50px] sticky top-0 z-30"
>
	<Breadcrumb />
	<JobViewer />
	<CurrentVault />
</div>
