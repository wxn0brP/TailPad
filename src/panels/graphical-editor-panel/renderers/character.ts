import {
	createNumberField,
	createSelectField,
	createTextField,
} from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderCharacter: ActionRenderer = (content, action, ctx) => {
	const { path } = ctx;

	switch (action.type) {
		case "show-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(path, "id", v)),
			);
			content.appendChild(
				createTextField("url", action.url, v => updateField(path, "url", v)),
			);
			content.appendChild(
				createSelectField(
					"position",
					action.position,
					[
						"left",
						"center",
						"right",
					],
					v => updateField(path, "position", v),
				),
			);
			content.appendChild(
				createSelectField(
					"transition",
					action.transition ?? "fade",
					[
						"fade",
						"slide",
						"none",
					],
					v => updateField(path, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(path, "transitionDuration", v),
				),
			);
			break;
		case "hide-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(path, "id", v)),
			);
			content.appendChild(
				createSelectField(
					"transition",
					action.transition ?? "fade",
					[
						"fade",
						"slide",
						"none",
					],
					v => updateField(path, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(path, "transitionDuration", v),
				),
			);
			break;
		case "move-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(path, "id", v)),
			);
			content.appendChild(
				createSelectField(
					"position",
					action.position,
					[
						"left",
						"center",
						"right",
					],
					v => updateField(path, "position", v),
				),
			);
			content.appendChild(
				createNumberField("duration", action.duration ?? 500, v =>
					updateField(path, "duration", v),
				),
			);
			break;
	}
};
