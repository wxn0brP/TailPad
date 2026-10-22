import { textarea } from "#panels/editor-panel";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import JSON5 from "json5";
import { mgl } from "./mlg";
import { root } from "./state";

export function save() {
	try {
		const parsed = JSON5.parse(textarea.value);
		const sceneConfig = Array.isArray(parsed) ? parsed : parsed?.sceneConfig;
		if (!Array.isArray(sceneConfig))
			throw new Error("Scene must be an array of actions");
		root.set("data", {
			sceneConfig,
		});
		uiMsg("Saved", {
			extraTime: -2,
		});
	} catch (e) {
		// Ignore incomplete/invalid JSON5
		console.error(e);
		uiMsg("Invalid JSON5");
	}
}

export function updateData(mutator: (obj: any) => void) {
	const current = root.get("data") ?? {};
	const clone = structuredClone(current);

	mutator(clone);

	root.set("data", clone);
}

export function render() {
	const value = root.get("data");
	const sceneConfig = Array.isArray(value) ? value : (value?.sceneConfig ?? []);
	textarea.value = JSON5.stringify(sceneConfig, null, 2);
}

mgl.utils = {
	render,
	save,
};
