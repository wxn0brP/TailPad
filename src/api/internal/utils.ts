import { uiMsg } from "@wxn0brp/flanker-dialog";
import JSON5 from "json5";
import { root } from "./state";
import { textarea } from "#panels/editor-panel";
import { mgl } from "./mlg";

export function save() {
    try {
        const parsed = JSON5.parse(textarea.value);
        root.set("data", parsed);
        uiMsg("Saved", {
            extraTime: -2,
        });
    } catch (e) {
        // Ignore incomplete/invalid JSON5
        console.error(e);
        uiMsg("Invalid JSON5");
    }
}

export function updateData(mutator: (obj: any) => void): void {
    const current = root.get("data") ?? {};
    const clone = JSON.parse(JSON.stringify(current));

    mutator(clone);

    root.set("data", clone);
}

export function render(): void {
    const value = root.get("data");
    textarea.value = JSON5.stringify(value ?? {}, null, 2);
}

mgl.utils = {
    render,
    save,
}