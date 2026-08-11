import { client } from "#api/internal/state";
import { save } from "#api/internal/utils";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import * as Y from "yjs";
import { ydoc } from "#api/internal/state";

const panel = createPanel(
	"Editor",
	`<textarea id="editor-textarea"></textarea>
    <div>
        <button id="save" class="btn">Save</button>
        <button id="hard-save" class="btn">Hard Save</button>
        <button id="undo" class="btn">Undo</button>
        <button id="redo" class="btn">Redo</button>
        <button id="search" class="btn">Search</button>
    </div>
    <div id="search-container" style="display: none;">
        <input type="text" id="search-input" placeholder="Search...">
        <input type="text" id="replace-input" placeholder="Replace...">
        <button id="search-next" class="btn">Next</button>
        <button id="replace" class="btn">Replace</button>
        <button id="replace-all" class="btn">Replace All</button>
        <button id="search-close" class="btn">Close</button>
    </div>`,
	"editor-panel",
);

export const textarea = panel.qs<HTMLTextAreaElement>("#editor-textarea");
const undoManager = new Y.UndoManager(ydoc.getMap("root"));

panel.qs("#save").addEventListener("click", () => save());
panel.qs("#hard-save").addEventListener("click", () => {
	save();
	client.emit("hard-save");
	uiMsg("Saved to database");
});

panel.qs("#undo").addEventListener("click", () => {
	undoManager.undo();
	uiMsg("Undo");
});

panel.qs("#redo").addEventListener("click", () => {
	undoManager.redo();
	uiMsg("Redo");
});

const searchContainer = panel.qs<HTMLDivElement>("#search-container");
const searchInput = panel.qs<HTMLInputElement>("#search-input");
const replaceInput = panel.qs<HTMLInputElement>("#replace-input");

panel.qs("#search").addEventListener("click", () => {
	searchContainer.style.display =
		searchContainer.style.display === "none" ? "flex" : "none";
	if (searchContainer.style.display === "flex") {
		searchInput.focus();
	}
});

panel.qs("#search-close").addEventListener("click", () => {
	searchContainer.style.display = "none";
	searchInput.value = "";
	replaceInput.value = "";
});

panel.qs("#search-next").addEventListener("click", () => {
	const searchTerm = searchInput.value;
	if (!searchTerm) return;

	const text = textarea.value;
	const cursorPos = textarea.selectionStart;
	const nextIndex = text.indexOf(searchTerm, cursorPos);

	if (nextIndex !== -1) {
		textarea.focus();
		textarea.setSelectionRange(nextIndex, nextIndex + searchTerm.length);
	} else {
		const firstIndex = text.indexOf(searchTerm);
		if (firstIndex !== -1) {
			textarea.focus();
			textarea.setSelectionRange(firstIndex, firstIndex + searchTerm.length);
			uiMsg("Wrapped to start");
		} else {
			uiMsg("Not found");
		}
	}
});

panel.qs("#replace").addEventListener("click", () => {
	const searchTerm = searchInput.value;
	const replaceTerm = replaceInput.value;
	if (!searchTerm) return;

	const text = textarea.value;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selectedText = text.substring(start, end);

	if (selectedText === searchTerm) {
		const newText =
			text.substring(0, start) + replaceTerm + text.substring(end);
		textarea.value = newText;
		textarea.setSelectionRange(start, start + replaceTerm.length);
		textarea.dispatchEvent(new Event("change"));
		uiMsg("Replaced");
	} else {
		panel.qs<HTMLButtonElement>("#search-next").click();
	}
});

panel.qs("#replace-all").addEventListener("click", () => {
	const searchTerm = searchInput.value;
	const replaceTerm = replaceInput.value;
	if (!searchTerm) return;

	const text = textarea.value;
	const regex = new RegExp(
		searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
		"g",
	);
	const newText = text.replace(regex, replaceTerm);
	textarea.value = newText;
	textarea.dispatchEvent(new Event("change"));
	uiMsg("Replaced all");
});

textarea.addEventListener("keydown", (e: KeyboardEvent) => {
	if ((e.ctrlKey || e.shiftKey) && e.key === "Enter") {
		e.preventDefault();
		save();
	}

	if (e.ctrlKey && e.key === "s") {
		e.preventDefault();
		save();
		uiMsg("Saved (Ctrl+S)");
	}

	if (e.ctrlKey && e.key === "z") {
		e.preventDefault();
		undoManager.undo();
		uiMsg("Undo (Ctrl+Z)");
	}

	if (e.ctrlKey && e.key === "y") {
		e.preventDefault();
		undoManager.redo();
		uiMsg("Redo (Ctrl+Y)");
	}

	if (e.ctrlKey && e.key === "f") {
		e.preventDefault();
		searchContainer.style.display = "flex";
		searchInput.focus();
	}
});
