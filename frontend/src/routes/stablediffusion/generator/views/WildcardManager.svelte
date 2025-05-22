<script lang="ts">
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import {
		Button,
		createToast,
		EditIcon,
		LabeledComponent,
		Modal,
		SimpleTable,
		TrashIcon
	} from '@lendruk/personal-svelte-ui-lib';

	export let wildcards: SDWildcard[];
	let isWildcardModalOpen = false;
	let modalMode: 'CREATE' | 'UPDATE' = 'CREATE';
	let modalWildcardName: string = '';
	let modalWildcardValues: string[] = [];
	let modalWildcardValue: string = '';
	let modalWildcardId: string = '';

	function onAddClick() {
		modalMode = 'CREATE';
		modalWildcardName = '';
		modalWildcardValues = [];
		modalWildcardId = '';
		isWildcardModalOpen = true;
	}

	function onEditClick(id: string) {
		const wildcard = wildcards.find((w) => w.id === id);
		if (wildcard) {
			modalWildcardName = wildcard.name;
			modalWildcardValues = wildcard.values;
			modalWildcardId = id;
		}
		modalMode = 'UPDATE';
		isWildcardModalOpen = true;
	}

	function onValueClick(value: string) {
		const index = modalWildcardValues.findIndex((val) => val === value);
		modalWildcardValues.splice(index, 1);
		modalWildcardValues = modalWildcardValues;
	}

	function onSubmitValue() {
		modalWildcardValues.push(modalWildcardValue);
		modalWildcardValues = modalWildcardValues;
		modalWildcardValue = '';
	}

	async function createWildcard() {
		const newWildcard = await HttpService.post<SDWildcard>(endpoints.wildCards(), {
			name: modalWildcardName,
			values: modalWildcardValues
		});
		wildcards.push(newWildcard);
		wildcards = wildcards;
		isWildcardModalOpen = false;
		modalWildcardName = '';
		modalWildcardValues = [];
		modalWildcardValue = '';
		createToast('Wildcard created successfully');
	}

	async function updateWildcard() {
		const updatedWildcard = await HttpService.put<SDWildcard>(
			endpoints.wildCard({ id: modalWildcardId }),
			{
				name: modalWildcardName,
				values: modalWildcardValues
			}
		);
		const index = wildcards.findIndex((wildcard) => wildcard.id === modalWildcardId);
		wildcards[index].name = updatedWildcard.name;
		wildcards[index].values = updatedWildcard.values;

		wildcards = wildcards;
		isWildcardModalOpen = false;
		modalWildcardName = '';
		modalWildcardId = '';
		modalWildcardValues = [];
		modalWildcardValue = '';
		createToast('Wildcard updated successfully');
	}

	async function deleteWildcard(id: string) {
		await HttpService.delete(endpoints.wildCard({ id }));
		const index = wildcards.findIndex((wildcard) => wildcard.id === id);
		if (index !== -1) {
			wildcards.splice(index, 1);
			wildcards = wildcards;
		}
		createToast('Wildcard deleted successfully');
	}
</script>

<div class="flex w-full flex-col gap-4">
	<div class="flex justify-between items-center">
		<div class="text-xl">Wildcards</div>
		<Button class="h-[40px]" onClick={onAddClick}>+ Add</Button>
	</div>
	<SimpleTable
		class="w-full"
		cols={[{ key: 'name', header: 'Name' }]}
		rows={wildcards}
		actions={[
			{ icon: EditIcon, name: 'Edit', onClick: (id) => {onEditClick(id as string)} },
			{ icon: TrashIcon, name: 'Delete', onClick: (id) => {deleteWildcard(id as string)} }
		]}
	/>
</div>
<Modal bind:showModal={isWildcardModalOpen} class={'max-w-[30%] max-h-[50%]'}>
	<div class="flex flex-col w-full p-2">
		<div class="text-xl">
			{modalMode === 'CREATE' ? 'Create Wildcard' : 'Update Wildcard'}
		</div>
		<div class="flex flex-col w-full flex-1">
			<LabeledComponent class="w-full">
				<div slot="label">Name</div>
				<input slot="content" bind:value={modalWildcardName} type="text" />
			</LabeledComponent>
			<LabeledComponent class="w-full">
				<div slot="label">Values</div>
				<div slot="content" class="flex flex-col gap-2">
					<input
						type="text"
						placeholder="Type and then press enter"
						bind:value={modalWildcardValue}
						on:keyup={(e) => e.key === 'Enter' && onSubmitValue()}
					/>
					<div class="flex gap-2 flex-1 flex-wrap overflow-scroll">
						{#each modalWildcardValues as value}
							<button on:click={() => onValueClick(value)} class="bg-red-950 p-2 rounded-md">
								{value}
							</button>
						{/each}
					</div>
				</div>
			</LabeledComponent>
		</div>
		<div class="flex justify-end">
			<Button
				onClick={() => (modalMode === 'CREATE' ? createWildcard() : updateWildcard())}
				class="h-[40px]">Submit</Button
			>
		</div>
	</div>
</Modal>
