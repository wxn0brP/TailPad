import { updateData } from "#api/internal/utils";
import { ActionRandomBranchType } from "../../../game/types";
import { createNumberField, createTextField } from "../field-helpers";
import { updateField, updateRandomBranch } from "../updates";
import { ActionRenderer } from "./types";

export const renderRandomBranch: ActionRenderer = (content, action, index) => {
	if (action.type !== "random-branch") return;

	const branchesContainer = document.createElement("div");
	branchesContainer.className = "branches-container";

	(action.branches ?? []).forEach((branch, branchIndex) => {
		const branchContainer = document.createElement("div");
		branchContainer.className = "branch-container";

		const fields = document.createElement("div");
		fields.className = "branch-fields";
		fields.appendChild(
			createTextField("scene", branch.scene, v =>
				updateRandomBranch(index, branchIndex, "scene", v),
			),
		);
		fields.appendChild(
			createNumberField("weight", branch.weight ?? 1, v =>
				updateRandomBranch(index, branchIndex, "weight", v),
			),
		);
		branchContainer.appendChild(fields);

		const deleteBranchButton = document.createElement("button");
		deleteBranchButton.textContent = "Delete";
		deleteBranchButton.className = "node-btn delete-btn";
		deleteBranchButton.addEventListener("click", () => {
			updateData(d => {
				const action = d.sceneConfig[index] as ActionRandomBranchType;
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
			const action = d.sceneConfig[index] as ActionRandomBranchType;
			action.branches.push({
				scene: "",
				weight: 1,
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
