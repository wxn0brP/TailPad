import { createNumberField } from "../field-helpers";
import { pushItem, removeItem, updateField } from "../updates";
import { ActionRandomBranchType } from "../../../game/types";
import { createButton, createCaseCard, element } from "./case-ui";
import { ActionRenderer } from "./types";

export const renderRandomBranch: ActionRenderer = (content, action, ctx) => {
	if (action.type !== "random-branch") return;
	const { path, renderList } = ctx;
	const random = action as ActionRandomBranchType;

	const branchesPath = [
		...path,
		"branches",
	];
	const list = element("div", "case-list");

	(random.branches ?? []).forEach((branch, index) => {
		const branchPath = [
			...branchesPath,
			index,
		];
		list.appendChild(
			createCaseCard({
				title: `Case ${index + 1}`,
				casePath: branchPath,
				inlineCase: branch,
				renderList,
				onDelete: () => removeItem(branchesPath, index),
				fields: [
					createNumberField("weight", branch.weight ?? 1, value =>
						updateField(branchPath, "weight", value),
					),
				],
			}),
		);
	});

	const addButton = createButton("Add case", "add-branch-btn");
	addButton.addEventListener("click", () =>
		pushItem(branchesPath, {
			weight: 1,
		}),
	);
	list.appendChild(addButton);
	content.appendChild(list);

	content.appendChild(
		createCaseCard({
			title: "Default",
			casePath: path,
			inlineCase: {
				actions: random.defaultActions,
				scene: random.defaultScene,
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
