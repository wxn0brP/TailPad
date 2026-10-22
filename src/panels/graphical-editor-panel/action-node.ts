import { root } from "#api/internal/state";
import { updateData } from "#api/internal/utils";
import { Action } from "../../game/types";
import { ACTION_TYPES, createDefaultAction } from "./defaults";
import {
	createBooleanField,
	createSelectField,
	createTextField,
} from "./field-helpers";
import { actionRenderers, renderFallback } from "./renderers";
import { updateField } from "./updates";

export function createActionNode(action: Action, index: number) {
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

	root.doc.transact(() => {
		const data = root.get("data");
		if (data && data.sceneConfig) {
			downButton.disabled = index === data.sceneConfig.length - 1;
		}
	});

	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Delete";
	deleteButton.className = "node-btn delete-btn";
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
			const newAction = createDefaultAction(newType);
			Object.assign(oldAction, {
				name: oldAction.name,
				noWaitForEnd: oldAction.noWaitForEnd,
			});
			d.sceneConfig[index] = newAction;
		});
	}

	content.appendChild(
		createSelectField("type", action.type, ACTION_TYPES, onChange),
	);

	content.appendChild(
		createTextField("name", action.name, v => updateField(index, "name", v)),
	);
	content.appendChild(
		createBooleanField("noWaitForEnd", action.noWaitForEnd, v =>
			updateField(index, "noWaitForEnd", v ? true : undefined),
		),
	);

	const renderer = actionRenderers[action.type] ?? renderFallback;
	renderer(content, action, index);

	node.appendChild(header);
	node.appendChild(content);
	return node;
}
