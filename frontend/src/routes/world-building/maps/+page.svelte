<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import { Application, Assets, Sprite } from 'pixi.js';
	import ContextMenu from './Components/ContextMenu.svelte';
	import { DraggableContainer } from './Components/DraggableContainer';
	import { LocationPinFactory } from './Components/LocationPin';

	const app = new Application();

	let pixiContainer: HTMLDivElement | undefined = $state(undefined);
	let draggableContainer: DraggableContainer = $state(new DraggableContainer());
	let background: Sprite = $state(new Sprite());
	let isContextMenuOpen = $state(false);

	let contextMenuTop = $state(0);
	let contextMenuLeft = $state(0);

	let items: Sprite[] = $state([]);

	async function onNewPinClick() {
		const locationPin = await LocationPinFactory.createPin(contextMenuLeft - 10, contextMenuTop);
		console.log('new pin');
		console.log('container pos');
		console.log(draggableContainer.x);
		console.log(draggableContainer.y);
		console.log('context location');
		console.log(contextMenuLeft - 10);
		console.log(contextMenuTop);
		console.log('pin location');
		console.log(locationPin.x);
		console.log(locationPin.y);
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
		background.x = 0;
		background.y = 0;

		draggableContainer.interactive = true;
		draggableContainer.addChild(background);

		draggableContainer.on('rightclick', (event) => {
			contextMenuTop = event.y;
			contextMenuLeft = event.x + 10;
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
		bind:top={contextMenuTop}
		bind:left={contextMenuLeft}
		bind:isContextMenuOpen
	/>
</div>

<svelte:window on:click={() => (isContextMenuOpen = false)} />
