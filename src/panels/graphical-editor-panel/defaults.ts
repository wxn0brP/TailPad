import { Action } from "../../game/types";

export const ACTION_TYPES: string[] = [
	"text",
	"background",
	"delay",
	"go-to-scene",
	"dialog-choice",
	"play-music",
	"stop-music",
	"play-sound",
	"set-volume",
	"show-character",
	"hide-character",
	"move-character",
	"set-variable",
	"condition",
	"random-branch",
	"effect",
];

export function createDefaultAction(newType: string): Action {
	switch (newType) {
		case "text":
			return {
				type: "text",
				text: "",
			};
		case "background":
			return {
				type: "background",
				url: "",
			};
		case "delay":
			return {
				type: "delay",
				ms: 1000,
			};
		case "go-to-scene":
			return {
				type: "go-to-scene",
				scene: "",
			};
		case "dialog-choice":
			return {
				type: "dialog-choice",
				text: "",
				choices: [],
			};
		case "play-music":
			return {
				type: "play-music",
				url: "",
				loop: true,
				fadeIn: 0,
				force: false,
			};
		case "stop-music":
			return {
				type: "stop-music",
				fadeOut: 0,
			};
		case "play-sound":
			return {
				type: "play-sound",
				url: "",
				volume: 1.0,
			};
		case "set-volume":
			return {
				type: "set-volume",
				channel: "music",
				volume: 1.0,
			};
		case "show-character":
			return {
				type: "show-character",
				id: "",
				url: "",
				position: "center",
				transition: "fade",
				transitionDuration: 500,
			};
		case "hide-character":
			return {
				type: "hide-character",
				id: "",
				transition: "fade",
				transitionDuration: 500,
			};
		case "move-character":
			return {
				type: "move-character",
				id: "",
				position: "center",
				duration: 500,
			};
		case "set-variable":
			return {
				type: "set-variable",
				name: "",
				value: "",
				operation: "set",
			};
		case "condition":
			return {
				type: "condition",
				branches: [],
				defaultScene: "",
			};
		case "random-branch":
			return {
				type: "random-branch",
				branches: [],
				defaultScene: "",
			};
		case "effect":
			return {
				type: "effect",
				effect: "shake",
				duration: 500,
			};
		default:
			throw new Error(`Unknown action type: ${newType}`);
	}
}
