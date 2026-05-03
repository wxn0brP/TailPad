export function createPanel(name: string, body: string, id: string) {
    const panel = document.createElement("div");
    panel.classList.add("panel");
    if (id) panel.id = id;

    panel.innerHTML = `
        <div class="panel-header">${name}</div>
        <div class="panel-content">
            ${body}
        </div>
    `;

    document.body.appendChild(panel);
    return panel;
}
