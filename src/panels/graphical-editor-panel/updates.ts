import { ActionPath } from "../../game/types";
import { mutateList, updateAtPath } from "./path";

export function updateField(path: ActionPath, key: string, value: any) {
	updateAtPath(path, node => {
		node[key] = value;
	});
}

export function insertItem(listPath: ActionPath, index: number, item: any) {
	mutateList(listPath, list => list.splice(index, 0, item));
}

export function pushItem(listPath: ActionPath, item: any) {
	mutateList(listPath, list => list.push(item));
}

export function removeItem(listPath: ActionPath, index: number) {
	mutateList(listPath, list => list.splice(index, 1));
}

export function replaceItem(listPath: ActionPath, index: number, item: any) {
	mutateList(listPath, list => {
		list[index] = item;
	});
}

export function moveItem(listPath: ActionPath, index: number, delta: number) {
	mutateList(listPath, list => {
		const target = index + delta;
		if (target < 0 || target >= list.length) return;
		const [item] = list.splice(index, 1);
		list.splice(target, 0, item);
	});
}
