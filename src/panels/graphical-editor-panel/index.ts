import { client, root } from "#api/internal/state";
import { save, updateData } from "#api/internal/utils";
import { undoManager } from "#panels/editor-panel";
import { createPanel } from "#panels/createPanel";
import { Action } from "../../game/types";
import { ValidationIssue, validateSceneConfig } from "../../game/validate";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import { createActionNode } from "./action-node";
import "./style.scss";

const panel = createPanel("Graphical Editor", ``, "graphical-editor-panel");
const container = panel.qs(".panel-content");

let knownScenes: string[] = [];

function renderGraphicalEditor() {
	const data = root.get("data") as {
		sceneConfig: Action[];
	};
	container.innerHTML = "";

	const editorContainer = document.createElement("div");
	editorContainer.className = "graphical-editor-container";

	const actions = data?.sceneConfig ?? [];
	const issues = validateSceneConfig(actions, knownScenes);

	editorContainer.appendChild(createSaveToolbar());
	editorContainer.appendChild(createValidationSummary(issues));

	const nodes: HTMLElement[] = [];
	actions.forEach((action, index) => {
		const node = createActionNode(action, index);
		nodes.push(node);
		editorContainer.appendChild(node);
	});

	const byIndex = new Map<number, ValidationIssue[]>();
	for (const issue of issues) {
		const list = byIndex.get(issue.index) ?? [];
		list.push(issue);
		byIndex.set(issue.index, list);
	}
	for (const [index, list] of byIndex) {
		const node = nodes[index];
		if (!node) continue;
		node.classList.add(
			list.some(i => i.level === "error") ? "has-error" : "has-warning",
		);
		node.title = list.map(i => i.message).join("\n");
	}

	const addButton = document.createElement("button");
	addButton.textContent = "Add Action";
	addButton.className = "add-action-btn";
	addButton.addEventListener("click", () => {
		updateData(d => {
			if (!d.sceneConfig) {
				d.sceneConfig = [];
			}
			d.sceneConfig.push({
				type: "text",
				text: "New action",
			});
		});
	});

	editorContainer.appendChild(addButton);
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
		renderGraphicalEditor();
	});
}

client.on("connect", refreshKnownScenes);
client.on("scenes:changed", refreshKnownScenes);
