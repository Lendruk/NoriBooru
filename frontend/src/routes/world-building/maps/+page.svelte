<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { Vector2 } from '$lib/Vector2';
	import { Application, Assets, Sprite } from 'pixi.js';
	import ContextMenu from './Components/ContextMenu.svelte';
	import { DraggableContainer } from './Components/DraggableContainer';
	import { LocationPinFactory } from './Components/LocationPin';
	const app = new Application();

	let pixiContainer: HTMLDivElement | undefined = $state(undefined);
	let draggableContainer: DraggableContainer = $state(new DraggableContainer());
	let background: Sprite = $state(new Sprite());
	let isContextMenuOpen = $state(false);

	let contextMenuLocalPosition = $state<Vector2>({ x: 0, y: 0 });
	let contextMenuGlobalPosition = $state<Vector2>({ x: 0, y: 0 });

	let items: Sprite[] = $state([]);

	async function onNewPinClick() {
		const locationPin = await LocationPinFactory.createPin(
			contextMenuLocalPosition.x,
			contextMenuLocalPosition.y
		);
		items.push(locationPin);
		draggableContainer.addChild(locationPin);
	}

	async function init() {
		await app.init();
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
			isContextMenuOpen = true;
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
		{onNewPinClick}
		bind:top={contextMenuGlobalPosition.y}
		bind:left={contextMenuGlobalPosition.x}
		bind:isContextMenuOpen
	/>
</div>

<svelte:window on:click={() => (isContextMenuOpen = false)} />
