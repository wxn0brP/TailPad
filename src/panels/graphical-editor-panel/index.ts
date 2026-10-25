import { client, root } from "#api/internal/state";
import { save } from "#api/internal/utils";
import { undoManager } from "#panels/editor-panel";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import { Action, ActionPath } from "../../game/types";
import { ValidationIssue, validateSceneConfig } from "../../game/validate";
import { renderActionList } from "./action-list";
import { setKnownScenes } from "./context";
import { getSceneConfig, pathKey } from "./path";
import "./style.scss";

const panel = createPanel("Graphical Editor", ``, "graphical-editor-panel");
const container = panel.qs(".panel-content");

let knownScenes: string[] = [];

function renderGraphicalEditor() {
	const actions = getSceneConfig() as Action[];
	container.innerHTML = "";

	setKnownScenes(knownScenes);

	const editorContainer = document.createElement("div");
	editorContainer.className = "graphical-editor-container";

	const issues = validateSceneConfig(actions, knownScenes);

	editorContainer.appendChild(createSaveToolbar());
	editorContainer.appendChild(createValidationSummary(issues));
	editorContainer.appendChild(renderActionList([], actions));

	const byPath = new Map<
		string,
		{
			level: "error" | "warning";
			messages: string[];
			path: ActionPath;
		}
	>();
	for (const issue of issues) {
		const key = pathKey(issue.path);
		const entry = byPath.get(key) ?? {
			level: issue.level,
			messages: [],
			path: issue.path,
		};
		if (issue.level === "error") entry.level = "error";
		entry.messages.push(issue.message);
		byPath.set(key, entry);
	}

	const nodes = new Map<string, HTMLElement>();
	editorContainer
		.querySelectorAll<HTMLElement>("[data-path]")
		.forEach(node => nodes.set(node.dataset.path ?? "", node));

	for (const entry of byPath.values()) {
		let node: HTMLElement | undefined;
		for (let length = entry.path.length; length >= 0; length--) {
			node = nodes.get(pathKey(entry.path.slice(0, length)));
			if (node) break;
		}
		if (!node) continue;
		node.classList.add(entry.level === "error" ? "has-error" : "has-warning");
		node.title = [
			node.title,
			...entry.messages,
		]
			.filter(Boolean)
			.join("\n");
	}

	container.appendChild(editorContainer);
}

function createSaveToolbar() {
	const toolbar = document.createElement("div");
	toolbar.className = "graphical-editor-toolbar";

	const saveButton = document.createElement("button");
	saveButton.textContent = "Save";
	saveButton.className = "btn";
	saveButton.addEventListener("click", () => save());

	const hardSaveButton = document.createElement("button");
	hardSaveButton.textContent = "Save now";
	hardSaveButton.className = "btn";
	hardSaveButton.addEventListener("click", () => {
		save();
		client.emit("hard-save");
		uiMsg("Saved");
	});

	const undoButton = document.createElement("button");
	undoButton.textContent = "Undo";
	undoButton.className = "btn";
	undoButton.addEventListener("click", () => {
		undoManager.undo();
		uiMsg("Undo");
	});

	const redoButton = document.createElement("button");
	redoButton.textContent = "Redo";
	redoButton.className = "btn";
	redoButton.addEventListener("click", () => {
		undoManager.redo();
		uiMsg("Redo");
	});

	toolbar.append(saveButton, hardSaveButton, undoButton, redoButton);
	return toolbar;
}

function createValidationSummary(issues: ValidationIssue[]) {
	const summary = document.createElement("div");
	summary.className = "validation-summary";

	const errors = issues.filter(i => i.level === "error").length;
	const warnings = issues.length - errors;

	if (!errors && !warnings) {
		summary.classList.add("is-valid");
		summary.textContent = "No issues";
		return summary;
	}

	summary.classList.add(errors ? "has-errors" : "has-warnings");
	const parts: string[] = [];
	if (errors) parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
	if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
	summary.textContent = parts.join(", ");
	return summary;
}

renderGraphicalEditor();
root.observeDeep(renderGraphicalEditor);

function refreshKnownScenes() {
	client.emit("scenes:list", res => {
		if (res.err) return;
		knownScenes = res.data;
		setKnownScenes(knownScenes);
		renderGraphicalEditor();
	});
}

client.on("connect", refreshKnownScenes);
client.on("scenes:changed", refreshKnownScenes);
