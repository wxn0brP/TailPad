import { createPanel } from "#panels/createPanel";
import { mainScene } from "#panels/game";
import "./style.scss";

const panel = createPanel(
	"Variables",
	`<div class="variables-panel-content">
        <div id="variables-list"></div>
        <div class="variables-controls">
            <input type="text" id="var-name" placeholder="name" />
            <select id="var-operation">
                <option value="set">set</option>
                <option value="add">add</option>
                <option value="subtract">subtract</option>
                <option value="multiply">multiply</option>
                <option value="divide">divide</option>
            </select>
            <input type="text" id="var-value" placeholder="value" />
            <button id="var-set" class="btn">Set</button>
        </div>
    </div>`,
	"variables-panel",
);

const list = panel.qs<HTMLDivElement>("#variables-list");
const nameInput = panel.qs<HTMLInputElement>("#var-name");
const operationSelect = panel.qs<HTMLSelectElement>("#var-operation");
const valueInput = panel.qs<HTMLInputElement>("#var-value");

function parseValue(raw: string): string | number | boolean {
	const trimmed = raw.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
	return raw;
}

function render() {
	const variables = mainScene.variableManager.getAll();
	list.innerHTML = "";

	const entries = Object.entries(variables);
	if (!entries.length) {
		const empty = document.createElement("div");
		empty.className = "variables-empty";
		empty.textContent = "No variables yet";
		list.appendChild(empty);
		return;
	}

	for (const [name, value] of entries) {
		const row = document.createElement("div");
		row.className = "variable-row";

		const nameEl = document.createElement("span");
		nameEl.className = "variable-name";
		nameEl.textContent = name;
		row.appendChild(nameEl);

		const valueEl = document.createElement("span");
		valueEl.className = "variable-value";
		valueEl.textContent = String(value);
		row.appendChild(valueEl);

		const deleteButton = document.createElement("button");
		deleteButton.className = "btn delete-btn";
		deleteButton.textContent = "Delete";
		deleteButton.addEventListener("click", () => {
			mainScene.variableManager.delete(name);
		});
		row.appendChild(deleteButton);

		list.appendChild(row);
	}
}

panel.qs("#var-set").addEventListener("click", () => {
	const name = nameInput.value.trim();
	if (!name) return;

	mainScene.variableManager.set(
		name,
		parseValue(valueInput.value),
		operationSelect.value as "set" | "add" | "subtract" | "multiply" | "divide",
	);
	nameInput.value = "";
	valueInput.value = "";
});

nameInput.addEventListener("keydown", e => {
	if (e.key === "Enter") panel.qs<HTMLButtonElement>("#var-set").click();
});

mainScene.variableManager.subscribe(render);
render();
