import { createSelectField, createTextField } from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

function parseValue(raw: string): string | number | boolean {
	const trimmed = raw.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
	return raw;
}

export const renderVariable: ActionRenderer = (content, action, index) => {
	if (action.type !== "set-variable") return;

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
			v => updateField(index, "operation", v),
		),
	);
	content.appendChild(
		createTextField("value", String(action.value ?? ""), v =>
			updateField(index, "value", parseValue(v)),
		),
	);
};
