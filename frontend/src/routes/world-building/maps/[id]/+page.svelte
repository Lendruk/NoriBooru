<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { Vector2 } from '$lib/Vector2';
	import { Button } from '@lendruk/personal-svelte-ui-lib';
	import { Application, Assets, Sprite } from 'pixi.js';
	import ContextMenu from '../Components/ContextMenu.svelte';
	import { DraggableContainer } from '../Components/DraggableContainer';
	import { LocationPinFactory } from '../Components/LocationPin';

	let app = new Application();
	let pixiContainer: HTMLDivElement | undefined = $state(undefined);
	let draggableContainer: DraggableContainer = $state(new DraggableContainer());
	let background: Sprite = $state(new Sprite());
	let isMapContextMenuOpen = $state(false);
	let contextMenuType = $state<'MAP' | 'POI'>('MAP');

	let contextMenuLocalPosition = $state<Vector2>({ x: 0, y: 0 });
	let contextMenuGlobalPosition = $state<Vector2>({ x: 0, y: 0 });

	let items: DraggableContainer[] = $state([]);

	async function onNewPinClick() {
		const locationPin = await LocationPinFactory.createPin(
			contextMenuLocalPosition.x,
			contextMenuLocalPosition.y
		);
		items.push(locationPin);
		draggableContainer.addChild(locationPin);

		locationPin.on('rightclick', (event) => {
			console.log('Right click POI');
			event.stopPropagation();
			contextMenuGlobalPosition.x = event.x + 10;
			contextMenuGlobalPosition.y = event.y;
			contextMenuType = 'POI';
			isMapContextMenuOpen = true;
		});
	}

	async function init() {
		await app.init({ width: pixiContainer?.clientWidth, height: pixiContainer?.clientHeight });
		console.log('App initialized');
		pixiContainer!.appendChild(app.canvas);
		const texture = await Assets.load(
			HttpService.buildGetImageUrl('7d252fc6-e8c7-4da8-9903-6aaa8452d8a6', 'png')
		);
		background = new Sprite(texture);
		background.interactive = true;
		background.x = 0;
		background.y = 0;

		draggableContainer.interactive = true;
		draggableContainer.addChild(background);

		background.on('rightclick', (event) => {
			const localPosition = background.toLocal(event.data.global);
			contextMenuGlobalPosition.y = event.y;
			contextMenuGlobalPosition.x = event.x + 10;
			contextMenuLocalPosition.x = localPosition.x;
			contextMenuLocalPosition.y = localPosition.y;
			contextMenuType = 'MAP';
			isMapContextMenuOpen = true;
		});

		app.canvas.addEventListener('contextmenu', (event) => {
			event.preventDefault();
		});

		app.stage.addChild(draggableContainer);
	}
	$effect(() => {
		init();
	});
</script>

<div class="flex flex-1 h-full">
	<div class="flex flex-1" bind:this={pixiContainer}></div>
	<ContextMenu
		bind:top={contextMenuGlobalPosition.y}
		bind:left={contextMenuGlobalPosition.x}
		bind:isContextMenuOpen={isMapContextMenuOpen}
	>
		{#if contextMenuType === 'MAP'}
			Context Menu
			<Button onClick={onNewPinClick}>PIN ALTA!!</Button>
		{:else if contextMenuType === 'POI'}
			Poi menu
		{/if}
	</ContextMenu>
	<div>Toolbox</div>
</div>

<svelte:window on:click={() => (isMapContextMenuOpen = false)} />
