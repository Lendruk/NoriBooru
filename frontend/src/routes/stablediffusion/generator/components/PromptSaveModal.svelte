<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';

	export let isOpen: boolean;
	export let onSubmit: (name: string) => void | Promise<void>;
	export let promptName: string;

	function onKeyPress(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	function onBackgroundClick() {
		isOpen = false;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	on:click={onBackgroundClick}
	class="absolute flex items-center justify-center h-full w-full top-0 left-0 z-50 backdrop-blur-sm"
>
	<div on:click={(e) => e.stopPropagation()} class="bg-zinc-900 p-4 min-w-[20%] min-h-[20%]">
		<div class="text-xl">Save a new prompt</div>
		<LabeledComponent>
			<div slot="label">Name</div>
			<input slot="content" type="text" bind:value={promptName} />
		</LabeledComponent>
		<Button
			class="h-[40px]"
			onClick={() => {
				onSubmit(promptName);
				isOpen = false;
			}}>Submit</Button
		>
	</div>
</div>

<svelte:window on:keydown={onKeyPress} />
