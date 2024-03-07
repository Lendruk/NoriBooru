<script lang="ts">
	export let showModal = false; 
	export { cssClass as class};
	
	let cssClass = "";
	let dialog: HTMLDialogElement;

	$: if (dialog && showModal) dialog.showModal();
	$: if (dialog && !showModal) dialog.close();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
	class={`bg-surface-color text-white rounded-md min-w-[30%] min-h-[30%] flex ${cssClass}`}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="flex flex-1" on:click|stopPropagation>
		<slot name="header" />
		<slot />
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}

	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
