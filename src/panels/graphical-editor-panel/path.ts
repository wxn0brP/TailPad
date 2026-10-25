import { root } from "#api/internal/state";
import { updateData } from "#api/internal/utils";
import { ActionPath } from "../../game/types";

function sceneConfigOf(data: any): any[] {
	if (Array.isArray(data)) return data;
	return data?.sceneConfig ?? [];
}

export function getSceneConfig(): any[] {
	return sceneConfigOf(root.get("data"));
}

export function getNode(path: ActionPath) {
	let node: any = sceneConfigOf(root.get("data"));
	for (const part of path) {
		if (node == null) return undefined;
		node = node[part as any];
	}
	return node;
}

export function getList(listPath: ActionPath): any[] {
	const list = getNode(listPath);
	return Array.isArray(list) ? list : [];
}

export function pathKey(path: ActionPath) {
	return path.join("/");
}

export function parentPath(path: ActionPath) {
	return path.slice(0, -1);
}

export function updateAtPath(path: ActionPath, mutate: (node: any) => void) {
	updateData(data => {
		const config = Array.isArray(data) ? data : (data.sceneConfig ??= []);
		let node: any = config;
		for (const part of path) {
			if (node == null) return;
			node = node[part as any];
		}
		if (node !== undefined) mutate(node);
	});
}

export function mutateList(
	listPath: ActionPath,
	mutate: (list: any[]) => void,
) {
	if (!listPath.length) {
		updateData(data => {
			const config = Array.isArray(data) ? data : (data.sceneConfig ??= []);
			mutate(config);
		});
		return;
	}

	updateData(data => {
		const config = Array.isArray(data) ? data : (data.sceneConfig ??= []);
		const key = listPath[listPath.length - 1] as any;
		const parent = getNodeFrom(config, listPath.slice(0, -1));
		if (!parent) return;
		if (!Array.isArray(parent[key])) parent[key] = [];
		mutate(parent[key]);
	});
}

function getNodeFrom(config: any, path: ActionPath) {
	let node: any = config;
	for (const part of path) {
		if (node == null) return undefined;
		node = node[part as any];
	}
	return node;
}
