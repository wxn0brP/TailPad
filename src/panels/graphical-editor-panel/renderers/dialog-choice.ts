import { updateData } from "#api/internal/utils";
import { ActionDialogChoiceType } from "../../../game/types";
import { createTextField } from "../field-helpers";
import { updateChoice, updateField } from "../updates";
import { ActionRenderer } from "./types";

export const renderDialogChoice: ActionRenderer = (content, action, index) => {
	if (action.type !== "dialog-choice") return;

	content.appendChild(
		createTextField("text", action.text, v => updateField(index, "text", v)),
	);
	const choicesContainer = document.createElement("div");
	choicesContainer.className = "choices-container";

	(action.choices ?? []).forEach((choice, choiceIndex) => {
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
};
