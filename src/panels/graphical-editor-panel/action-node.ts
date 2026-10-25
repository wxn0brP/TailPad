import { Action, ActionPath } from "../../game/types";
import { getList, pathKey } from "./path";
import { ACTION_TYPES, createDefaultAction } from "./defaults";
import {
	createBooleanField,
	createSelectField,
	createTextField,
} from "./field-helpers";
import { actionRenderers, renderFallback } from "./renderers";
import type { RenderList } from "./renderers/types";
import {
	insertItem,
	moveItem,
	removeItem,
	replaceItem,
	updateField,
} from "./updates";

const collapsed = new Set<string>();

function describe(action: Action) {
	switch (action.type) {
		case "dialog-choice":
			return `${action.choices?.length ?? 0} choices`;
		case "condition":
			return action.expression?.trim()
				? `expression: ${action.expression}`
				: `${action.branches?.length ?? 0} rules`;
		case "random-branch":
			return `${action.branches?.length ?? 0} cases`;
		default:
			return action.type;
	}
}

export function createActionNode(
	action: Action,
	path: ActionPath,
	renderList: RenderList,
) {
	const index = Number(path[path.length - 1]);
	const listPath = path.slice(0, -1);
	const total = getList(listPath).length;
	const key = pathKey(path);

	const node = document.createElement("div");
	node.className = "action-node";
	node.dataset.path = key;

	const header = document.createElement("div");
	header.className = "node-header";

	const title = document.createElement("span");
	title.className = "node-title";
	title.textContent = `${index}: ${action.name || action.type} (${describe(action)})`;
	header.appendChild(title);

	const controls = document.createElement("div");
	controls.className = "node-controls";

	const collapseButton = document.createElement("button");
	collapseButton.type = "button";
	collapseButton.className = "node-btn collapse-btn";
	const content = document.createElement("div");
	content.className = "node-content";

	const applyCollapsed = () => {
		const value = collapsed.has(key);
		collapseButton.textContent = value ? "Expand" : "Collapse";
		content.classList.toggle("node-collapsed", value);
	};
	collapseButton.addEventListener("click", () => {
		if (collapsed.has(key)) collapsed.delete(key);
		else collapsed.add(key);
		applyCollapsed();
	});
	controls.appendChild(collapseButton);

	const upButton = document.createElement("button");
	upButton.type = "button";
	upButton.textContent = "Up";
	upButton.className = "node-btn";
	upButton.disabled = index === 0;
	upButton.addEventListener("click", () => moveItem(listPath, index, -1));
	controls.appendChild(upButton);

	const downButton = document.createElement("button");
	downButton.type = "button";
	downButton.textContent = "Down";
	downButton.className = "node-btn";
	downButton.disabled = index >= total - 1;
	downButton.addEventListener("click", () => moveItem(listPath, index, 1));
	controls.appendChild(downButton);

	const insertButton = document.createElement("button");
	insertButton.type = "button";
	insertButton.textContent = "Insert below";
	insertButton.className = "node-btn";
	insertButton.title = "Insert a text action right after this one";
	insertButton.addEventListener("click", () => {
		insertItem(listPath, index + 1, {
			type: "text",
			text: "",
		});
	});
	controls.appendChild(insertButton);

	const duplicateButton = document.createElement("button");
	duplicateButton.type = "button";
	duplicateButton.textContent = "Duplicate";
	duplicateButton.className = "node-btn";
	duplicateButton.addEventListener("click", () => {
		insertItem(listPath, index + 1, structuredClone(action));
	});
	controls.appendChild(duplicateButton);

	const deleteButton = document.createElement("button");
	deleteButton.type = "button";
	deleteButton.textContent = "Delete";
	deleteButton.className = "node-btn delete-btn";
	deleteButton.addEventListener("click", () => removeItem(listPath, index));
	controls.appendChild(deleteButton);

	header.appendChild(controls);

	function onChange(newType: string) {
		const next = createDefaultAction(newType);
		next.name = action.name;
		next.noWaitForEnd = action.noWaitForEnd;
		replaceItem(listPath, index, next);
	}

	content.appendChild(
		createSelectField("type", action.type, ACTION_TYPES, onChange),
	);
	content.appendChild(
		createTextField("name", action.name, v => updateField(path, "name", v)),
	);
	content.appendChild(
		createBooleanField("noWaitForEnd", action.noWaitForEnd, v =>
			updateField(path, "noWaitForEnd", v ? true : undefined),
		),
	);

	const renderer = actionRenderers[action.type] ?? renderFallback;
	renderer(content, action, {
		path,
		renderList,
	});

	node.appendChild(header);
	node.appendChild(content);
	applyCollapsed();
	return node;
}
