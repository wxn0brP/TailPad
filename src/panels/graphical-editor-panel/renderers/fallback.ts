import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import { updateAtPath } from "../path";
import type { ActionRenderer } from "./types";

export const renderFallback: ActionRenderer = (content, action, ctx) => {
	const warning = document.createElement("div");
	warning.className = "action-fallback-warning";
	warning.textContent = `Unsupported action type "${action.type}", edit as JSON`;
	content.appendChild(warning);

	const textarea = document.createElement("textarea");
	textarea.className = "action-json-editor";
	textarea.spellcheck = false;
	textarea.value = JSON.stringify(action, null, 2);
	textarea.addEventListener("change", () => {
		try {
			const parsed = JSON.parse(textarea.value);
			updateAtPath(ctx.path, node => {
				for (const key of Object.keys(node)) delete node[key];
				Object.assign(node, parsed);
			});
			uiMsg("Updated action");
		} catch (error) {
			console.error(error);
			uiMsg("Invalid JSON");
		}
	});
	content.appendChild(textarea);
};
