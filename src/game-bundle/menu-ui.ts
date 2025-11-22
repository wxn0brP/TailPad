export type MenuAction = "save" | "load" | "resume";

export class MenuUI {
    _container: HTMLElement;
    _resolve: (value: MenuAction) => void;

    constructor() {
        this._container = qs("#ui-container")!;
    }

    show(): Promise<MenuAction> {
        this._render();
        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    }

    _render() {
        this._container.innerHTML = "";

        const backdrop = document.createElement("div");
        backdrop.className = "menu-modal-backdrop";
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                this._close("resume");
            }
        };

        const modal = document.createElement("div");
        modal.className = "menu-modal";
        modal.innerHTML = `<h2>Game Menu</h2>`;

        const resumeButton = document.createElement("button");
        resumeButton.className = "menu-button";
        resumeButton.textContent = "Resume";
        resumeButton.onclick = () => this._close("resume");
        modal.appendChild(resumeButton);

        const saveButton = document.createElement("button");
        saveButton.className = "menu-button";
        saveButton.textContent = "Save Game";
        saveButton.onclick = () => {
            this._container.innerHTML = "";
            this._resolve("save");
        };
        modal.appendChild(saveButton);

        const loadButton = document.createElement("button");
        loadButton.className = "menu-button";
        loadButton.textContent = "Load Game";
        loadButton.onclick = () => {
            this._container.innerHTML = "";
            this._resolve("load");
        };
        modal.appendChild(loadButton);

        backdrop.appendChild(modal);
        this._container.appendChild(backdrop);
    }

    _close(value: MenuAction) {
        this._container.innerHTML = "";
        this._resolve(value);
    }
}
