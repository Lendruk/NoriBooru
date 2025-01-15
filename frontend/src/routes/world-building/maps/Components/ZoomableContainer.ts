import { Container } from 'pixi.js';

export class ZoomableContainer extends Container {
	private zoomFactor = 1.05;
	public constructor() {
		super();
		this.interactive = true;
		this.scale.set(1);

		this.on('wheel', this.onWheel);
	}

	private onWheel(event: WheelEvent) {
		if (event.deltaY < 0) {
			// Zoom in
			this.scale.x *= this.zoomFactor;
			this.scale.y *= this.zoomFactor;
		} else {
			// Zoom out
			this.scale.x /= this.zoomFactor;
			this.scale.y /= this.zoomFactor;
		}
	}
}
