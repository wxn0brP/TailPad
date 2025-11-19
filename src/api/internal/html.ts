import { uiMsg } from "@wxn0brp/flanker-dialog";
import { client } from "./state";
import { save } from "./utils";

export const textarea = qs<HTMLTextAreaElement>("#editor-textarea");

qs("#save").addEventListener("click", () => save());
qs("#hard-save").addEventListener("click", () => {
    save();
    client.emit("hard-save");
    uiMsg("Saved to database");
});

textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.shiftKey) && e.key === "Enter") {
        e.preventDefault();
        save();
    }
});