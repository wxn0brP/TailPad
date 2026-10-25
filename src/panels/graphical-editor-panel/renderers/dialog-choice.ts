import { createTextareaField } from "../field-helpers";
import { pushItem, removeItem, updateField } from "../updates";
import { createButton, createCaseCard, element } from "./case-ui";
import { ActionRenderer } from "./types";

export const renderDialogChoice: ActionRenderer = (content, action, ctx) => {
	if (action.type !== "dialog-choice") return;
	const { path, renderList } = ctx;

	content.appendChild(
		createTextareaField("text", action.text, v => updateField(path, "text", v)),
	);

	const choicesPath = [
		...path,
		"choices",
	];
	const list = element("div", "case-list");

	(action.choices ?? []).forEach((choice, index) => {
		const casePath = [
			...choicesPath,
			index,
		];
		list.appendChild(
			createCaseCard({
				title: `Choice ${index + 1}`,
				casePath,
				inlineCase: choice,
				renderList,
				onDelete: () => removeItem(choicesPath, index),
				fields: [
					createTextareaField("text", choice.text, v =>
						updateField(casePath, "text", v),
					),
				],
			}),
		);
	});

	const addButton = createButton("Add choice", "add-branch-btn");
	addButton.addEventListener("click", () =>
		pushItem(choicesPath, {
			text: "",
		}),
	);
	list.appendChild(addButton);
	content.appendChild(list);
};
