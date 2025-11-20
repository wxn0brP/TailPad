export const panelsContainer = qs("#panels-container");

export interface Config {
    minHeight: number;
    minWidth: number;
    height: number;
    width: number;
    top: number;
    left: number;
}

export function createPanel(name: string, body: string, opts: Config) {
    const panel = document.createElement("div");
    panel.classList.add("panel");

    if (opts.height) panel.style.height = `${opts.height}px`;
    if (opts.width) panel.style.width = `${opts.width}px`;
    if (opts.top) panel.style.top = `${opts.top}px`;
    if (opts.left) panel.style.left = `${opts.left}px`;

    if (opts.minHeight) panel.dataset.h = `${opts.minHeight}`;
    if (opts.minWidth) panel.dataset.w = `${opts.minWidth}`;

    panel.innerHTML = `
        <div class="panel-header">
            <span>${name}</span>
            <div class="panel-controls">
                <button class="panel-toggle-btn">-</button>
            </div>
        </div>
        <div class="panel-content">
            ${body}
        </div>
    `;

    panelsContainer.appendChild(panel);
    return panel;
}