import { root } from "#api/internal/state";
import { updateData } from "#api/internal/utils";
import { Action } from "../game/types";
import "./style.scss";

const container = qs("#graphical-editor-content");

function renderGraphicalEditor() {
    const data = root.get("data") as { sceneConfig: Action[] };
    container.innerHTML = "";

    const editorContainer = document.createElement("div");
    editorContainer.className = "graphical-editor-container";

    if (data && data.sceneConfig) {
        data.sceneConfig.forEach((action, index) => {
            editorContainer.appendChild(createActionNode(action, index));
        });
    }

    const addButton = document.createElement("button");
    addButton.textContent = "Add Action";
    addButton.className = "add-action-btn";
    addButton.addEventListener("click", () => {
        updateData(d => {
            if (!d.sceneConfig) {
                d.sceneConfig = [];
            }
            d.sceneConfig.push({ type: "text", text: "New action" });
        });
    });

    editorContainer.appendChild(addButton);
    container.appendChild(editorContainer);
}

function createActionNode(action: Action, index: number): HTMLElement {
    const node = document.createElement("div");
    node.className = "action-node";

    const header = document.createElement("div");
    header.className = "node-header";
    const title = document.createElement("span");
    title.className = "node-title";
    title.textContent = `${index}: ${action.name || action.type}`;
    header.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "node-controls";

    const upButton = document.createElement("button");
    upButton.textContent = "Up";
    upButton.className = "node-btn";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => {
        updateData(d => {
            const [item] = d.sceneConfig.splice(index, 1);
            d.sceneConfig.splice(index - 1, 0, item);
        });
    });
    controls.appendChild(upButton);

    const downButton = document.createElement("button");
    downButton.textContent = "Down";
    downButton.className = "node-btn";
    downButton.addEventListener("click", () => {
        updateData(d => {
            const [item] = d.sceneConfig.splice(index, 1);
            d.sceneConfig.splice(index + 1, 0, item);
        });
    });
    controls.appendChild(downButton);

    // We need to check the length of the sceneConfig array in the next render cycle
    root.doc.transact(() => {
        const data = root.get("data");
        if (data && data.sceneConfig) {
            downButton.disabled = index === data.sceneConfig.length - 1;
        }
    });


    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "node-btn";
    deleteButton.addEventListener("click", () => {
        updateData(d => {
            d.sceneConfig.splice(index, 1);
        });
    });
    controls.appendChild(deleteButton);
    header.appendChild(controls);

    const content = document.createElement("div");
    content.className = "node-content";

    function onChange(newType: string) {
        updateData(d => {
            const oldAction = d.sceneConfig[index];
            let newAction: Action;
            switch (newType) {
                case "text":
                    newAction = {
                        type: "text",
                        text: "",
                    };
                    break;
                case "background":
                    newAction = {
                        type: "background",
                        url: "",
                    };
                    break;
                case "delay":
                    newAction = {
                        type: "delay",
                        ms: 1000,
                    };
                    break;
                default:
                    newAction = oldAction;
                    break;
            }
            Object.assign(oldAction, {
                name: oldAction.name,
                noWaitForEnd: oldAction.noWaitForEnd
            });
            d.sceneConfig[index] = newAction;
        });
    }

    // Type selector
    content.appendChild(
        createSelectField(
            "type",
            action.type,
            [
                "text",
                "background",
                "delay"
            ],
            onChange
        )
    );

    // Common fields
    content.appendChild(createTextField("name", action.name, (v) => updateField(index, "name", v)));
    content.appendChild(createBooleanField("noWaitForEnd", action.noWaitForEnd, (v) => updateField(index, "noWaitForEnd", v ? true : undefined)));

    // Type-specific fields
    switch (action.type) {
        case "text":
            content.appendChild(createTextField("text", action.text, (v) => updateField(index, "text", v)));
            break;
        case "background":
            content.appendChild(createTextField("url", action.url, (v) => updateField(index, "url", v)));
            break;
        case "delay":
            content.appendChild(createNumberField("ms", action.ms, (v) => updateField(index, "ms", v)));
            break;
    }

    node.appendChild(header);
    node.appendChild(content);
    return node;
}

function createField(label: string, input: HTMLElement): HTMLElement {
    const field = document.createElement("div");
    field.className = "field";
    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    field.appendChild(labelEl);
    field.appendChild(input);
    return field;
}

function createSelectField(key: string, value: string, options: string[], onChange: (value: string) => void): HTMLElement {
    const select = document.createElement("select");
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (opt === value) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    select.addEventListener("change", (e) => onChange((e.target as HTMLSelectElement).value));
    return createField(key, select as unknown as HTMLElement);
}


function createTextField(key: string, value: string, onChange: (value: string) => void): HTMLElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    input.addEventListener("change", (e) => onChange((e.target as HTMLInputElement).value));
    return createField(key, input);
}

function createNumberField(key: string, value: number, onChange: (value: number) => void): HTMLElement {
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value || 0);
    input.addEventListener("change", (e) => onChange(Number((e.target as HTMLInputElement).value)));
    return createField(key, input);
}

function createBooleanField(key: string, value: boolean, onChange: (value: boolean) => void): HTMLElement {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value || false;
    input.addEventListener("change", (e) => onChange((e.target as HTMLInputElement).checked));
    return createField(key, input);
}

function updateField(index: number, key: string, value: any) {
    updateData(d => {
        d.sceneConfig[index][key] = value;
    });
}

renderGraphicalEditor();
root.observeDeep(renderGraphicalEditor);