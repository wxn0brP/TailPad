import {
	createBooleanField,
	createNumberField,
	createSelectField,
	createTextField,
} from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderSimple: ActionRenderer = (content, action, index) => {
	switch (action.type) {
		case "text":
			content.appendChild(
				createTextField("text", action.text, v =>
					updateField(index, "text", v),
				),
			);
			break;
		case "background":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			break;
		case "delay":
			content.appendChild(
				createNumberField("ms", action.ms, v => updateField(index, "ms", v)),
			);
			break;
		case "go-to-scene":
			content.appendChild(
				createTextField("scene", action.scene, v =>
					updateField(index, "scene", v),
				),
			);
			break;
		case "play-music":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			content.appendChild(
				createBooleanField("loop", action.loop ?? true, v =>
					updateField(index, "loop", v),
				),
			);
			content.appendChild(
				createNumberField("fadeIn", action.fadeIn ?? 0, v =>
					updateField(index, "fadeIn", v),
				),
			);
			break;
		case "stop-music":
			content.appendChild(
				createNumberField("fadeOut", action.fadeOut ?? 0, v =>
					updateField(index, "fadeOut", v),
				),
			);
			break;
		case "play-sound":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			content.appendChild(
				createNumberField("volume", action.volume ?? 1.0, v =>
					updateField(index, "volume", v),
				),
			);
			break;
		case "set-volume":
			content.appendChild(
				createSelectField(
					"channel",
					action.channel,
					[
						"music",
						"sound",
					],
					v => updateField(index, "channel", v),
				),
			);
			content.appendChild(
				createNumberField("volume", action.volume, v =>
					updateField(index, "volume", v),
				),
			);
			break;
		case "effect":
			content.appendChild(
				createSelectField(
					"effect",
					action.effect,
					[
						"shake",
						"flash",
						"fade",
					],
					v => updateField(index, "effect", v),
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
