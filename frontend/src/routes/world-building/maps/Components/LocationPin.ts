import pinIcon from '$lib/assets/pin.png';
import { Assets, Sprite } from 'pixi.js';
import { DraggableContainer } from './DraggableContainer';
export class LocationPinFactory {
	public static async createPin(x: number, y: number): Promise<DraggableContainer> {
		const texture = await Assets.load(pinIcon);
		const draggableContainer = new DraggableContainer();
		const pin = new Sprite(texture);
		pin.interactive = true;
		pin.x = x;
		pin.y = y;
		// pin.width = 32;
		// pin.height = 32;
		pin.scale = 0.1;

		draggableContainer.addChild(pin);
		return draggableContainer;
	}
}
