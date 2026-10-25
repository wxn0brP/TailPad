import { Action, ActionPath } from "../../game/types";
import { createActionNode } from "./action-node";
import { ACTION_TYPES, createDefaultAction } from "./defaults";
import { pushItem } from "./updates";

export function renderActionList(
	listPath: ActionPath,
	actions: Action[],
): HTMLElement {
	const container = document.createElement("div");
	container.className = "action-list";
	if (!listPath.length) container.classList.add("action-list-root");

	if (!actions.length) {
		const empty = document.createElement("div");
		empty.className = "action-list-empty";
		empty.textContent = "No actions";
		container.appendChild(empty);
	}

	actions.forEach((action, index) => {
		container.appendChild(
			createActionNode(
				action,
				[
					...listPath,
					index,
				],
				renderActionList,
			),
		);
	});

	const bar = document.createElement("div");
	bar.className = "action-add-bar";

	const select = document.createElement("select");
	for (const type of ACTION_TYPES) {
		const option = document.createElement("option");
		option.value = type;
		option.textContent = type;
		select.appendChild(option);
	}

	const button = document.createElement("button");
	button.type = "button";
	button.className = "node-btn add-action-btn";
	button.textContent = "+ Add action";
	button.addEventListener("click", () => {
		pushItem(listPath, createDefaultAction(select.value));
	});

	bar.appendChild(select);
	bar.appendChild(button);
	container.appendChild(bar);
	return container;
}
