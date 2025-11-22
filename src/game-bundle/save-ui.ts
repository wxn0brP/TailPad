import { getSaves, SaveData } from "./save";

type Mode = "save" | "load";

export class SaveLoadUI {
    _container: HTMLElement;
    _mode: Mode;
    _resolve: (value: number | null) => void;

    constructor() {
        this._container = qs("#ui-container")!;
    }

    show(mode: Mode): Promise<number | null> {
        this._mode = mode;
        this._render();
        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    }

    _render() {
        this._container.innerHTML = "";

        const backdrop = document.createElement("div");
        backdrop.className = "save-load-modal-backdrop";

        const modal = document.createElement("div");
        modal.className = "save-load-modal";
        modal.innerHTML = `<h2>${this._mode === "save" ? "Save Game" : "Load Game"}</h2>`;

        const slotsContainer = document.createElement("div");
        slotsContainer.className = "save-slots";

        const saves = getSaves();
        saves.forEach((save, index) => {
            const slot = document.createElement("div");
            slot.className = "save-slot";
            if (!save) {
                slot.classList.add("empty");
                slot.innerHTML = `<span>Slot ${index + 1} - Empty</span>`;
            } else {
                slot.innerHTML = `
                    <div class="slot-info">
                        <span>Slot ${index + 1}: ${save.sceneName}</span>
                    </div>
                    <div class="slot-timestamp">
                        ${new Date(save.timestamp).toLocaleString()}
                    </div>
                `;
            }
            slot.onclick = () => this._onSlotClick(index, save);
            slotsContainer.appendChild(slot);
        });

        const closeButton = document.createElement("button");
        closeButton.className = "close-button";
        closeButton.textContent = this._mode === "load" ? "New Game" : "Cancel";
        closeButton.onclick = () => this._close(null);

        modal.appendChild(slotsContainer);
        modal.appendChild(closeButton);
        backdrop.appendChild(modal);
        this._container.appendChild(backdrop);
    }

    _onSlotClick(index: number, save: SaveData | null) {
        if (this._mode === "load" && !save)
            return;
        this._close(index);
    }

    _close(value: number | null) {
        this._container.innerHTML = "";
        this._resolve(value);
    }
}
