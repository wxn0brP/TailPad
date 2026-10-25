import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import { ActionPath, InlineCase } from "../../../game/types";
import { createSceneField } from "../field-helpers";
import { getNode, mutateList } from "../path";
import { updateField } from "../updates";
import { RenderList } from "./types";

export function element(tag: string, className: string, text?: string) {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

export function createButton(text: string, className = "node-btn") {
	const button = document.createElement("button");
	button.type = "button";
	button.className = className;
	button.textContent = text;
	return button;
}

async function inlineScene(
	actionsPath: ActionPath,
	casePath: ActionPath,
	sceneKey: string,
) {
	const sceneId = getNode(casePath)?.[sceneKey];
	if (!sceneId) {
		uiMsg("Set a scene first");
		return;
	}

	try {
		const res = await fetch(
			`/assets/scenes/${encodeURIComponent(sceneId)}.json`,
		);
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		const actions = await res.json();
		if (!Array.isArray(actions)) throw new Error("Scene is not an array");
		mutateList(actionsPath, list => list.push(...actions));
		uiMsg(`Inlined ${actions.length} actions from ${sceneId}`);
	} catch (error) {
		uiMsg(`Inline failed: ${(error as Error).message}`);
	}
}

export function createSceneTarget(
	casePath: ActionPath,
	inlineCase: InlineCase,
	sceneKey = "scene",
	actionsPath?: ActionPath,
) {
	const row = element("div", "scene-target");
	row.appendChild(
		createSceneField("go to scene", inlineCase.scene ?? "", value =>
			updateField(casePath, sceneKey, value),
		),
	);

	const targetActionsPath = actionsPath ?? [
		...casePath,
		"actions",
	];
	const button = createButton("Inline scene");
	button.addEventListener(
		"click",
		() => void inlineScene(targetActionsPath, casePath, sceneKey),
	);
	row.appendChild(button);
	return row;
}

export interface CaseCardOptions {
	title: string;
	casePath: ActionPath;
	inlineCase: InlineCase;
	renderList: RenderList;
	onDelete?: () => void;
	fields?: HTMLElement[];
	actionsPath?: ActionPath;
	sceneKey?: string;
}

export function createCaseCard(options: CaseCardOptions) {
	const { title, casePath, inlineCase, renderList } = options;
	const card = element("div", "case-card");

	const header = element("div", "case-header");
	header.appendChild(element("span", "case-title", title));
	if (options.onDelete) {
		const deleteButton = createButton("Delete", "node-btn delete-btn");
		deleteButton.addEventListener("click", options.onDelete);
		header.appendChild(deleteButton);
	}
	card.appendChild(header);

	for (const field of options.fields ?? []) card.appendChild(field);

	const actionsPath = options.actionsPath ?? [
		...casePath,
		"actions",
	];
	card.appendChild(
		createSceneTarget(casePath, inlineCase, options.sceneKey, actionsPath),
	);
	card.appendChild(element("div", "case-section-title", "Inline actions"));
	card.appendChild(renderList(actionsPath, inlineCase.actions ?? []));
	return card;
}
