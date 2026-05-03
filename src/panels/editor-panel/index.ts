import { client } from "#api/internal/state";
import { save } from "#api/internal/utils";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";

const panel = createPanel(
    "Editor",
    `<textarea id="editor-textarea"></textarea>
    <div>
        <button id="save" class="btn">Save</button>
        <button id="hard-save" class="btn">Hard Save</button>
    </div>`,
    "editor-panel"
);

export const textarea = panel.qs<HTMLTextAreaElement>("#editor-textarea");

panel.qs("#save").addEventListener("click", () => save());
panel.qs("#hard-save").addEventListener("click", () => {
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
