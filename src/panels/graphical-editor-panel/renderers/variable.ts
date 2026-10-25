import {
	createSelectField,
	createTextareaField,
	createTextField,
} from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

function parseValue(raw: string): string | number | boolean {
	const trimmed = raw.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
	return raw;
}

export const renderVariable: ActionRenderer = (content, action, ctx) => {
	if (action.type !== "set-variable") return;
	const { path } = ctx;

	content.appendChild(
		createTextField("name", action.name, v => updateField(path, "name", v)),
	);
	content.appendChild(
		createSelectField(
			"operation",
			action.operation ?? "set",
			[
				"set",
				"add",
				"subtract",
				"multiply",
				"divide",
			],
			v => updateField(path, "operation", v),
		),
	);
	content.appendChild(
		createTextareaField("value", String(action.value ?? ""), v =>
			updateField(path, "value", parseValue(v)),
		),
	);
};
