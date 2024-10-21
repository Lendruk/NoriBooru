<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import { Application, Assets } from 'pixi.js';
	import ContextMenu from './Components/ContextMenu.svelte';
	import { DragableSprite } from './Components/DragableSprite';
	import { LocationPin } from './Components/LocationPin';
	import { ZoomableContainer } from './Components/ZoomableContainer';

	const app = new Application();

	let pixiContainer: HTMLDivElement | undefined = $state(undefined);
	let zoomableContainer: ZoomableContainer = $state(new ZoomableContainer());
	let background: DragableSprite = $state(new DragableSprite());
	let isContextMenuOpen = $state(false);

	let contextMenuTop = $state(0);
	let contextMenuLeft = $state(0);

	let items: LocationPin[] = $state([]);

	function onNewPinClick() {
		const locationPin = new LocationPin();
		locationPin.x = contextMenuLeft - 10;
		locationPin.y = contextMenuTop;
		console.log(locationPin);
		items.push(locationPin);
		console.log('test');
		zoomableContainer.addChild(locationPin);
	}

	async function init() {
		await app.init();
		console.log('App initialized');
		pixiContainer!.appendChild(app.canvas);
		const texture = await Assets.load(
			HttpService.buildGetImageUrl('7d252fc6-e8c7-4da8-9903-6aaa8452d8a6', 'png')
		);
		background = new DragableSprite(texture);
		background.x = 0;
		background.y = 0;

		zoomableContainer.interactive = true;
		zoomableContainer.addChild(background);

		zoomableContainer.on('rightclick', (event) => {
			contextMenuTop = event.y;
			contextMenuLeft = event.x + 10;
			isContextMenuOpen = true;
		});

		app.canvas.addEventListener('contextmenu', (event) => {
			event.preventDefault();
		});

		app.stage.addChild(zoomableContainer);
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
