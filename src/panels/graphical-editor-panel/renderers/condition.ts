import { createSelectField, createTextField } from "../field-helpers";
import { pushItem, removeItem, updateField } from "../updates";
import { ActionConditionType } from "../../../game/types";
import { createButton, createCaseCard, element } from "./case-ui";
import { ActionRenderer } from "./types";

function parseValue(raw: string): string | number | boolean {
	const trimmed = raw.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
	return raw;
}

export const renderCondition: ActionRenderer = (content, action, ctx) => {
	if (action.type !== "condition") return;
	const { path, renderList } = ctx;
	const condition = action as ActionConditionType;
	const mode = condition.expression?.trim() ? "expression" : "rules";

	content.appendChild(
		createSelectField(
			"mode",
			mode,
			[
				"rules",
				"expression",
			],
			value => {
				if (value === "expression")
					updateField(path, "expression", condition.expression || "true");
				else updateField(path, "expression", "");
			},
		),
	);

	if (mode === "expression") {
		content.appendChild(
			createTextField("expression", condition.expression ?? "", value =>
				updateField(path, "expression", value),
			),
		);
		content.appendChild(
			createCaseCard({
				title: "When true",
				casePath: path,
				inlineCase: {
					actions: condition.actions,
					scene: condition.scene,
				},
				actionsPath: [
					...path,
					"actions",
				],
				renderList,
			}),
		);
		content.appendChild(
			createCaseCard({
				title: "Otherwise",
				casePath: path,
				inlineCase: {
					actions: condition.elseActions,
					scene: condition.defaultScene,
				},
				actionsPath: [
					...path,
					"elseActions",
				],
				sceneKey: "defaultScene",
				renderList,
			}),
		);
		return;
	}

	const branchesPath = [
		...path,
		"branches",
	];
	const list = element("div", "case-list");

	(condition.branches ?? []).forEach((branch, index) => {
		const branchPath = [
			...branchesPath,
			index,
		];
		list.appendChild(
			createCaseCard({
				title: `Rule ${index + 1}`,
				casePath: branchPath,
				inlineCase: branch,
				renderList,
				onDelete: () => removeItem(branchesPath, index),
				fields: [
					createTextField("variable", branch.condition, value =>
						updateField(branchPath, "condition", value),
					),
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
						value => updateField(branchPath, "operator", value),
					),
					createTextField("value", String(branch.value ?? ""), value =>
						updateField(branchPath, "value", parseValue(value)),
					),
				],
			}),
		);
	});

	const addButton = createButton("Add rule", "add-branch-btn");
	addButton.addEventListener("click", () =>
		pushItem(branchesPath, {
			condition: "",
			operator: "==",
			value: "",
		}),
	);
	list.appendChild(addButton);
	content.appendChild(list);

	content.appendChild(
		createCaseCard({
			title: "Default",
			casePath: path,
			inlineCase: {
				actions: condition.defaultActions,
				scene: condition.defaultScene,
			},
			actionsPath: [
				...path,
				"defaultActions",
			],
			sceneKey: "defaultScene",
			renderList,
		}),
	);
};
