import pinIcon from '$lib/assets/pin.png';
import { Assets, Sprite } from 'pixi.js';
export class LocationPinFactory {
	public static async createPin(x: number, y: number): Promise<Sprite> {
		const texture = await Assets.load(pinIcon);
		const pin = new Sprite(texture);
		pin.interactive = true;
		pin.x = x;
		pin.y = y;
		// pin.width = 32;
		// pin.height = 32;
		pin.scale = 0.3;
		return pin;
	}
}
