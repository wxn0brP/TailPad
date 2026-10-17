export interface Sprite {
	id: string;
	element: HTMLImageElement;
	position: "left" | "center" | "right";
}

export class SpriteEngine {
	private sprites: Map<string, Sprite> = new Map();

	constructor(private container: HTMLDivElement) {}

	showCharacter(
		id: string,
		url: string,
		position: "left" | "center" | "right",
		transition: "fade" | "slide" | "none" = "fade",
		transitionDuration = 500,
	) {
		return new Promise<void>(resolve => {
			const existing = this.sprites.get(id);
			if (existing) {
				existing.element.src = url;
				this.moveToPosition(existing, position, transitionDuration);
				resolve();
				return;
			}

			const img = document.createElement("img");
			img.className = "character-sprite";
			img.src = url;
			img.dataset.characterId = id;

			img.style.opacity = "0";
			img.style.transition = `opacity ${transitionDuration}ms, transform ${transitionDuration}ms`;

			this.container.appendChild(img);

			const sprite: Sprite = {
				id,
				element: img,
				position,
			};
			this.sprites.set(id, sprite);

			this.applyPosition(img, position);

			let settled = false;
			const settle = () => {
				if (settled) return;
				settled = true;
				resolve();
			};

			let started = false;
			const finishShow = () => {
				if (started) return;
				started = true;
				requestAnimationFrame(() => {
					if (transition === "slide") {
						img.style.opacity = "1";
						img.style.transform = "translateX(0)";
					} else {
						img.style.opacity = "1";
					}
					setTimeout(settle, transitionDuration);
				});
			};

			img.addEventListener("load", finishShow, {
				once: true,
			});

			img.addEventListener(
				"error",
				() => {
					console.error("Sprite load error:", url);
					settle();
				},
				{
					once: true,
				},
			);

			if (img.complete) {
				if (img.naturalWidth > 0) finishShow();
				else settle();
			}
		});
	}

	hideCharacter(
		id: string,
		transition: "fade" | "slide" | "none" = "fade",
		transitionDuration = 500,
	) {
		return new Promise<void>(resolve => {
			const sprite = this.sprites.get(id);
			if (!sprite) {
				resolve();
				return;
			}

			if (transition === "fade") {
				sprite.element.style.opacity = "0";
			} else if (transition === "slide") {
				sprite.element.style.opacity = "0";
				const direction =
					sprite.position === "left"
						? "-100%"
						: sprite.position === "right"
							? "100%"
							: "0";
				sprite.element.style.transform = `translateX(${direction})`;
			} else {
				sprite.element.style.opacity = "0";
			}

			setTimeout(() => {
				sprite.element.remove();
				this.sprites.delete(id);
				resolve();
			}, transitionDuration);
		});
	}

	moveCharacter(
		id: string,
		position: "left" | "center" | "right",
		duration = 500,
	) {
		return new Promise<void>(resolve => {
			const sprite = this.sprites.get(id);
			if (!sprite) {
				resolve();
				return;
			}

			this.moveToPosition(sprite, position, duration);
			setTimeout(resolve, duration);
		});
	}

	private applyPosition(
		element: HTMLImageElement,
		position: "left" | "center" | "right",
	) {
		element.style.position = "absolute";
		element.style.bottom = "0";
		this.applyPositionStyles(element, position);
	}

	private applyPositionStyles(
		element: HTMLElement,
		position: "left" | "center" | "right",
	) {
		element.style.left = "";
		element.style.right = "";

		switch (position) {
			case "left":
				element.style.left = "10%";
				element.style.transform = "translateX(-50%)";
				break;
			case "center":
				element.style.left = "50%";
				element.style.transform = "translateX(-50%)";
				break;
			case "right":
				element.style.right = "10%";
				element.style.transform = "translateX(50%)";
				break;
		}
	}

	private moveToPosition(
		sprite: Sprite,
		position: "left" | "center" | "right",
		duration: number,
	) {
		sprite.position = position;
		sprite.element.style.transition = `left ${duration}ms, right ${duration}ms, transform ${duration}ms`;
		this.applyPositionStyles(sprite.element, position);
	}

	clearAll() {
		this.sprites.forEach(sprite => sprite.element.remove());
		this.sprites.clear();
	}

	dispose() {
		this.clearAll();
	}
}
