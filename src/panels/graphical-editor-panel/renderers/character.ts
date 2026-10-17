import {
	createNumberField,
	createSelectField,
	createTextField,
} from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderCharacter: ActionRenderer = (content, action, index) => {
	switch (action.type) {
		case "show-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
			);
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
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
					v => updateField(index, "position", v),
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
					v => updateField(index, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(index, "transitionDuration", v),
				),
			);
			break;
		case "hide-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
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
					v => updateField(index, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(index, "transitionDuration", v),
				),
			);
			break;
		case "move-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
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
					v => updateField(index, "position", v),
				),
			);
			content.appendChild(
				createNumberField("duration", action.duration ?? 500, v =>
					updateField(index, "duration", v),
				),
			);
			break;
	}
};
