import { root } from "#api/internal/state";
import { updateData } from "#api/internal/utils";
import { createPanel } from "#panels/createPanel";
import {
	Action,
	ActionConditionType,
	ActionDialogChoiceType,
} from "../../game/types";
import "./style.scss";

const panel = createPanel("Graphical Editor", ``, "graphical-editor-panel");

const container = panel.qs(".panel-content");

function renderGraphicalEditor() {
	const data = root.get("data") as {
		sceneConfig: Action[];
	};
	container.innerHTML = "";

	const editorContainer = document.createElement("div");
	editorContainer.className = "graphical-editor-container";

	if (data && data.sceneConfig) {
		data.sceneConfig.forEach((action, index) => {
			editorContainer.appendChild(createActionNode(action, index));
		});
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

function createActionNode(action: Action, index: number): HTMLElement {
	const node = document.createElement("div");
	node.className = "action-node";

	const header = document.createElement("div");
	header.className = "node-header";
	const title = document.createElement("span");
	title.className = "node-title";
	title.textContent = `${index}: ${action.name || action.type}`;
	header.appendChild(title);

	const controls = document.createElement("div");
	controls.className = "node-controls";

	const upButton = document.createElement("button");
	upButton.textContent = "Up";
	upButton.className = "node-btn";
	upButton.disabled = index === 0;
	upButton.addEventListener("click", () => {
		updateData(d => {
			const [item] = d.sceneConfig.splice(index, 1);
			d.sceneConfig.splice(index - 1, 0, item);
		});
	});
	controls.appendChild(upButton);

	const downButton = document.createElement("button");
	downButton.textContent = "Down";
	downButton.className = "node-btn";
	downButton.addEventListener("click", () => {
		updateData(d => {
			const [item] = d.sceneConfig.splice(index, 1);
			d.sceneConfig.splice(index + 1, 0, item);
		});
	});
	controls.appendChild(downButton);

	// We need to check the length of the sceneConfig array in the next render cycle
	root.doc.transact(() => {
		const data = root.get("data");
		if (data && data.sceneConfig) {
			downButton.disabled = index === data.sceneConfig.length - 1;
		}
	});

	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Delete";
	deleteButton.className = "node-btn delete-btn";
	deleteButton.addEventListener("click", () => {
		updateData(d => {
			d.sceneConfig.splice(index, 1);
		});
	});
	controls.appendChild(deleteButton);
	header.appendChild(controls);

	const content = document.createElement("div");
	content.className = "node-content";

	function onChange(newType: string) {
		updateData(d => {
			const oldAction = d.sceneConfig[index];
			let newAction: Action;
			switch (newType) {
				case "text":
					newAction = {
						type: "text",
						text: "",
					};
					break;
				case "background":
					newAction = {
						type: "background",
						url: "",
					};
					break;
				case "delay":
					newAction = {
						type: "delay",
						ms: 1000,
					};
					break;
				case "go-to-scene":
					newAction = {
						type: "go-to-scene",
						scene: "",
					};
					break;
				case "dialog-choice":
					newAction = {
						type: "dialog-choice",
						text: "",
						choices: [],
					};
					break;
				case "play-music":
					newAction = {
						type: "play-music",
						url: "",
						loop: true,
						fadeIn: 0,
					};
					break;
				case "stop-music":
					newAction = {
						type: "stop-music",
						fadeOut: 0,
					};
					break;
				case "play-sound":
					newAction = {
						type: "play-sound",
						url: "",
						volume: 1.0,
					};
					break;
				case "set-volume":
					newAction = {
						type: "set-volume",
						channel: "music",
						volume: 1.0,
					};
					break;
				case "show-character":
					newAction = {
						type: "show-character",
						id: "",
						url: "",
						position: "center",
						transition: "fade",
						transitionDuration: 500,
					};
					break;
				case "hide-character":
					newAction = {
						type: "hide-character",
						id: "",
						transition: "fade",
						transitionDuration: 500,
					};
					break;
				case "move-character":
					newAction = {
						type: "move-character",
						id: "",
						position: "center",
						duration: 500,
					};
					break;
				case "set-variable":
					newAction = {
						type: "set-variable",
						name: "",
						value: "",
						operation: "set",
					};
					break;
				case "condition":
					newAction = {
						type: "condition",
						branches: [],
						defaultScene: "",
					};
					break;
				default:
					throw new Error(`Unknown action type: ${newType}`);
			}
			Object.assign(oldAction, {
				name: oldAction.name,
				noWaitForEnd: oldAction.noWaitForEnd,
			});
			d.sceneConfig[index] = newAction;
		});
	}

	// Type selector
	content.appendChild(
		createSelectField(
			"type",
			action.type,
			[
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
			],
			onChange,
		),
	);

	// Common fields
	content.appendChild(
		createTextField("name", action.name, v => updateField(index, "name", v)),
	);
	content.appendChild(
		createBooleanField("noWaitForEnd", action.noWaitForEnd, v =>
			updateField(index, "noWaitForEnd", v ? true : undefined),
		),
	);

	// Type-specific fields
	switch (action.type) {
		case "text":
			content.appendChild(
				createTextField("text", action.text, v =>
					updateField(index, "text", v),
				),
			);
			break;
		case "background":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			break;
		case "delay":
			content.appendChild(
				createNumberField("ms", action.ms, v => updateField(index, "ms", v)),
			);
			break;
		case "go-to-scene":
			content.appendChild(
				createTextField("scene", action.scene, v =>
					updateField(index, "scene", v),
				),
			);
			break;
		case "dialog-choice": {
			content.appendChild(
				createTextField("text", action.text, v =>
					updateField(index, "text", v),
				),
			);
			const choicesContainer = document.createElement("div");
			choicesContainer.className = "choices-container";

			action.choices.forEach((choice, choiceIndex) => {
				const choiceContainer = document.createElement("div");
				choiceContainer.className = "choice-container";

				const fields = document.createElement("div");
				fields.className = "choice-fields";
				fields.appendChild(
					createTextField("text", choice.text, v =>
						updateChoice(index, choiceIndex, "text", v),
					),
				);
				fields.appendChild(
					createTextField("scene", choice.scene, v =>
						updateChoice(index, choiceIndex, "scene", v),
					),
				);
				choiceContainer.appendChild(fields);

				const deleteChoiceButton = document.createElement("button");
				deleteChoiceButton.textContent = "Delete";
				deleteChoiceButton.className = "node-btn delete-btn";
				deleteChoiceButton.addEventListener("click", () => {
					updateData(d => {
						const action = d.sceneConfig[index] as ActionDialogChoiceType;
						action.choices.splice(choiceIndex, 1);
					});
				});
				choiceContainer.appendChild(deleteChoiceButton);
				choicesContainer.appendChild(choiceContainer);
			});

			const addChoiceButton = document.createElement("button");
			addChoiceButton.textContent = "Add Choice";
			addChoiceButton.className = "add-choice-btn";
			addChoiceButton.addEventListener("click", () => {
				updateData(d => {
					const action = d.sceneConfig[index] as ActionDialogChoiceType;
					action.choices.push({
						text: "",
						scene: "",
					});
				});
			});
			choicesContainer.appendChild(addChoiceButton);

			content.appendChild(choicesContainer);
			break;
		}
		case "play-music":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			content.appendChild(
				createBooleanField("loop", action.loop ?? true, v =>
					updateField(index, "loop", v),
				),
			);
			content.appendChild(
				createNumberField("fadeIn", action.fadeIn ?? 0, v =>
					updateField(index, "fadeIn", v),
				),
			);
			break;
		case "stop-music":
			content.appendChild(
				createNumberField("fadeOut", action.fadeOut ?? 0, v =>
					updateField(index, "fadeOut", v),
				),
			);
			break;
		case "play-sound":
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			content.appendChild(
				createNumberField("volume", action.volume ?? 1.0, v =>
					updateField(index, "volume", v),
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
					v => updateField(index, "channel", v),
				),
			);
			content.appendChild(
				createNumberField("volume", action.volume, v =>
					updateField(index, "volume", v),
				),
			);
			break;
		case "show-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
			);
			content.appendChild(
				createTextField("url", action.url, v => updateField(index, "url", v)),
			);
			content.appendChild(
				createSelectField(
					"position",
					action.position,
					[
						"left",
						"center",
						"right",
					],
					v => updateField(index, "position", v),
				),
			);
			content.appendChild(
				createSelectField(
					"transition",
					action.transition ?? "fade",
					[
						"fade",
						"slide",
						"none",
					],
					v => updateField(index, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(index, "transitionDuration", v),
				),
			);
			break;
		case "hide-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
			);
			content.appendChild(
				createSelectField(
					"transition",
					action.transition ?? "fade",
					[
						"fade",
						"slide",
						"none",
					],
					v => updateField(index, "transition", v),
				),
			);
			content.appendChild(
				createNumberField(
					"transitionDuration",
					action.transitionDuration ?? 500,
					v => updateField(index, "transitionDuration", v),
				),
			);
			break;
		case "move-character":
			content.appendChild(
				createTextField("id", action.id, v => updateField(index, "id", v)),
			);
			content.appendChild(
				createSelectField(
					"position",
					action.position,
					[
						"left",
						"center",
						"right",
					],
					v => updateField(index, "position", v),
				),
			);
			content.appendChild(
				createNumberField("duration", action.duration ?? 500, v =>
					updateField(index, "duration", v),
				),
			);
			break;
		case "set-variable":
			content.appendChild(
				createTextField("name", action.name, v =>
					updateField(index, "name", v),
				),
			);
			content.appendChild(
				createTextField("value", String(action.value), v => {
					const numValue = Number(v);
					const boolValue = v === "true" ? true : v === "false" ? false : v;
					updateField(
						index,
						"value",
						Number.isNaN(numValue) ? boolValue : numValue,
					);
				}),
			);
			content.appendChild(
				createSelectField(
					"operation",
					action.operation ?? "set",
					[
						"set",
						"add",
						"subtract",
						"multiply",
						"divide",
					],
					v => updateField(index, "operation", v),
				),
			);
			break;
		case "condition": {
			const branchesContainer = document.createElement("div");
			branchesContainer.className = "branches-container";

			action.branches.forEach((branch, branchIndex) => {
				const branchContainer = document.createElement("div");
				branchContainer.className = "branch-container";

				const fields = document.createElement("div");
				fields.className = "branch-fields";
				fields.appendChild(
					createTextField("condition", branch.condition, v =>
						updateConditionBranch(index, branchIndex, "condition", v),
					),
				);
				fields.appendChild(
					createSelectField(
						"operator",
						branch.operator,
						[
							"==",
							"!=",
							">",
							"<",
							">=",
							"<=",
						],
						v => updateConditionBranch(index, branchIndex, "operator", v),
					),
				);
				fields.appendChild(
					createTextField("value", String(branch.value), v => {
						const numValue = Number(v);
						const boolValue = v === "true" ? true : v === "false" ? false : v;
						updateConditionBranch(
							index,
							branchIndex,
							"value",
							Number.isNaN(numValue) ? boolValue : numValue,
						);
					}),
				);
				fields.appendChild(
					createTextField("scene", branch.scene, v =>
						updateConditionBranch(index, branchIndex, "scene", v),
					),
				);
				branchContainer.appendChild(fields);

				const deleteBranchButton = document.createElement("button");
				deleteBranchButton.textContent = "Delete";
				deleteBranchButton.className = "node-btn delete-btn";
				deleteBranchButton.addEventListener("click", () => {
					updateData(d => {
						const action = d.sceneConfig[index] as ActionConditionType;
						action.branches.splice(branchIndex, 1);
					});
				});
				branchContainer.appendChild(deleteBranchButton);
				branchesContainer.appendChild(branchContainer);
			});

			const addBranchButton = document.createElement("button");
			addBranchButton.textContent = "Add Branch";
			addBranchButton.className = "add-branch-btn";
			addBranchButton.addEventListener("click", () => {
				updateData(d => {
					const action = d.sceneConfig[index] as ActionConditionType;
					action.branches.push({
						condition: "",
						operator: "==",
						value: "",
						scene: "",
					});
				});
			});
			branchesContainer.appendChild(addBranchButton);

			content.appendChild(branchesContainer);
			content.appendChild(
				createTextField("defaultScene", action.defaultScene ?? "", v =>
					updateField(index, "defaultScene", v),
				),
			);
			break;
		}
		default: {
			const n: never = action;
			throw new Error(`Unknown action type: ${n}`);
		}
	}

	node.appendChild(header);
	node.appendChild(content);
	return node;
}

function createField(label: string, input: HTMLElement): HTMLElement {
	const field = document.createElement("div");
	field.className = "field";
	const labelEl = document.createElement("label");
	labelEl.textContent = label;
	field.appendChild(labelEl);
	field.appendChild(input);
	return field;
}

function createSelectField(
	key: string,
	value: string,
	options: string[],
	onChange: (value: string) => void,
): HTMLElement {
	const select = document.createElement("select");
	options.forEach(opt => {
		const option = document.createElement("option");
		option.value = opt;
		option.textContent = opt;
		if (opt === value) {
			option.selected = true;
		}
		select.appendChild(option);
	});
	select.addEventListener("change", e =>
		onChange((e.target as HTMLSelectElement).value),
	);
	return createField(key, select as unknown as HTMLElement);
}

function createTextField(
	key: string,
	value: string,
	onChange: (value: string) => void,
): HTMLElement {
	const input = document.createElement("input");
	input.type = "text";
	input.value = value || "";
	input.addEventListener("change", e =>
		onChange((e.target as HTMLInputElement).value),
	);
	return createField(key, input);
}

function createNumberField(
	key: string,
	value: number,
	onChange: (value: number) => void,
): HTMLElement {
	const input = document.createElement("input");
	input.type = "number";
	input.value = String(value || 0);
	input.addEventListener("change", e =>
		onChange(Number((e.target as HTMLInputElement).value)),
	);
	return createField(key, input);
}

function createBooleanField(
	key: string,
	value: boolean,
	onChange: (value: boolean) => void,
): HTMLElement {
	const input = document.createElement("input");
	input.type = "checkbox";
	input.checked = value || false;
	input.addEventListener("change", e =>
		onChange((e.target as HTMLInputElement).checked),
	);
	return createField(key, input);
}

function updateField(index: number, key: string, value: any) {
	updateData(d => {
		d.sceneConfig[index][key] = value;
	});
}

function updateChoice(
	actionIndex: number,
	choiceIndex: number,
	key: string,
	value: any,
) {
	updateData(d => {
		const action = d.sceneConfig[actionIndex] as ActionDialogChoiceType;
		action.choices[choiceIndex][key] = value;
	});
}

function updateConditionBranch(
	actionIndex: number,
	branchIndex: number,
	key: string,
	value: any,
) {
	updateData(d => {
		const action = d.sceneConfig[actionIndex] as ActionConditionType;
		(action.branches[branchIndex] as any)[key] = value;
	});
}

renderGraphicalEditor();
root.observeDeep(renderGraphicalEditor);
