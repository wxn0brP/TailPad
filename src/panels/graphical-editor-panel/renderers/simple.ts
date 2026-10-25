import {
	createBooleanField,
	createNumberField,
	createSceneField,
	createSelectField,
	createTextareaField,
	createTextField,
} from "../field-helpers";
import { updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderSimple: ActionRenderer = (content, action, ctx) => {
	const { path } = ctx;

	switch (action.type) {
		case "text":
			content.appendChild(
				createTextareaField("text", action.text, v =>
					updateField(path, "text", v),
				),
			);
			break;
		case "background":
			content.appendChild(
				createTextField("url", action.url, v => updateField(path, "url", v)),
			);
			break;
		case "delay":
			content.appendChild(
				createNumberField("ms", action.ms, v => updateField(path, "ms", v)),
			);
			break;
		case "go-to-scene":
			content.appendChild(
				createSceneField("scene", action.scene, v =>
					updateField(path, "scene", v),
				),
			);
			break;
		case "play-music":
			content.appendChild(
				createTextField("url", action.url, v => updateField(path, "url", v)),
			);
			content.appendChild(
				createBooleanField("loop", action.loop ?? true, v =>
					updateField(path, "loop", v),
				),
			);
			content.appendChild(
				createNumberField("fadeIn", action.fadeIn ?? 0, v =>
					updateField(path, "fadeIn", v),
				),
			);
			content.appendChild(
				createBooleanField("force", action.force ?? false, v =>
					updateField(path, "force", v),
				),
			);
			break;
		case "stop-music":
			content.appendChild(
				createNumberField("fadeOut", action.fadeOut ?? 0, v =>
					updateField(path, "fadeOut", v),
				),
			);
			break;
		case "play-sound":
			content.appendChild(
				createTextField("url", action.url, v => updateField(path, "url", v)),
			);
			content.appendChild(
				createNumberField("volume", action.volume ?? 1.0, v =>
					updateField(path, "volume", v),
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
					v => updateField(path, "channel", v),
				),
			);
			content.appendChild(
				createNumberField("volume", action.volume, v =>
					updateField(path, "volume", v),
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
					v => updateField(path, "effect", v),
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
