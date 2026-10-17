import { updateData } from "#api/internal/utils";
import { ActionConditionType } from "../../../game/types";
import { createSelectField, createTextField } from "../field-helpers";
import { updateConditionBranch, updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderCondition: ActionRenderer = (content, action, index) => {
	if (action.type !== "condition") return;

	content.appendChild(
		createTextField("expression", action.expression ?? "", v =>
			updateField(index, "expression", v),
		),
	);
	content.appendChild(
		createTextField("scene", action.scene ?? "", v =>
			updateField(index, "scene", v),
		),
	);
	const branchesContainer = document.createElement("div");
	branchesContainer.className = "branches-container";

	(action.branches ?? []).forEach((branch, branchIndex) => {
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
};
