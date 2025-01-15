import { FederatedPointerEvent, Sprite, Texture, type SpriteOptions } from 'pixi.js';

export class DragableSprite extends Sprite {
	public isDragging = false;
	public isDraggingEnabled = true;

	private dragOffset: { x: number; y: number };

	public constructor(options?: SpriteOptions | Texture) {
		super(options);

		this.interactive = true;
		this.dragOffset = { x: 0, y: 0 };

		this.on('pointerdown', this.onDragStart) // Start dragging on pointer down
			.on('pointerup', this.onDragEnd) // End dragging on pointer up
			.on('pointerupoutside', this.onDragEnd) // End dragging if pointer goes outside the sprite
			.on('pointermove', this.onDragMove); // Handle pointer movement
	}

	private onDragStart(event: FederatedPointerEvent) {
		this.isDragging = true;
		// Store the offset between the sprite's position and the pointer's position
		this.dragOffset = event.getLocalPosition(this.parent);
		this.dragOffset.x -= this.x;
		this.dragOffset.y -= this.y;
	}

	private onDragMove(event: FederatedPointerEvent) {
		if (this.isDragging) {
			// Update sprite position based on pointer movement
			const newPosition = event.getLocalPosition(this.parent);
			this.x = newPosition.x - this.dragOffset.x;
			this.y = newPosition.y - this.dragOffset.y;
		}
	}

	private onDragEnd() {
		this.alpha = 1; // Reset sprite opacity
		this.isDragging = false;
	}
}
