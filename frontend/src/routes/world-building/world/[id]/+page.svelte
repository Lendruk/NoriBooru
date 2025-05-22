<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import type { World } from '$lib/types/Worldbuilding/World';
	import {
		Button,
		createToast,
		LabeledComponent,
		TextArea,
		TextInput
	} from '@lendruk/personal-svelte-ui-lib';
	import { vaultStore } from '../../../../store';

	let worldName = $state('');
	let description = $state('');
	let id = $state('');

	$effect(() => {
		if ($page.params.id) {
			id = $page.params.id;
		}
		worldName = $vaultStore?.world?.name ?? '';
		description = $vaultStore?.world?.description ?? '';
	});

	async function createWorld() {
		const newWorld = await HttpService.post<World>(endpoints.world(), {
			name: worldName,
			description
		});

		VaultService.setVault({ ...$vaultStore!, world: newWorld });
		createToast('World created successfully!');
		goto(`/world-building/world/current`);
	}

	async function updateWorld() {
		const updatedWorld = await HttpService.put<World>(endpoints.world({ id }), {
			name: worldName,
			description
		});

		VaultService.setVault({ ...$vaultStore!, world: updatedWorld });
		createToast('World updated successfully!');
	}
</script>

<svelte:head>
	<title>NoriBooru - World Building</title>
</svelte:head>
<div class="bg-zinc-900 p-4 rounded-md">
	<div>
		<LabeledComponent>
			<div slot="label">World Name</div>
			<TextInput slot="content" placeholder="World name..." bind:value={worldName} />
		</LabeledComponent>
		<LabeledComponent>
			<div slot="label">Description</div>
			<TextArea slot="content" placeholder="Description..." bind:value={description} />
		</LabeledComponent>

		<Button onClick={() => (id === 'new' ? createWorld() : updateWorld())}
			>{id === 'new' ? 'Create' : 'Update'}</Button
		>
	</div>
</div>
