import { updateData } from "#api/internal/utils";
import {
	ActionConditionType,
	ActionDialogChoiceType,
	ActionRandomBranchType,
} from "../../game/types";

export function updateField(index: number, key: string, value: any) {
	updateData(d => {
		d.sceneConfig[index][key] = value;
	});
}

export function updateChoice(
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

export function updateConditionBranch(
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

export function updateRandomBranch(
	actionIndex: number,
	branchIndex: number,
	key: string,
	value: any,
) {
	updateData(d => {
		const action = d.sceneConfig[actionIndex] as ActionRandomBranchType;
		(action.branches[branchIndex] as any)[key] = value;
	});
}
