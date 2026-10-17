import {
	Action,
	ActionConditionType,
	ActionDialogChoiceType,
	ActionRandomBranchType,
} from "./types";

export interface ValidationIssue {
	level: "error" | "warning";
	index: number;
	message: string;
}

function collectTargetScenes(action: Action): string[] {
	switch (action.type) {
		case "go-to-scene":
			return [
				action.scene,
			];
		case "dialog-choice":
			return (action as ActionDialogChoiceType).choices.map(c => c.scene);
		case "condition": {
			const cond = action as ActionConditionType;
			const targets = (cond.branches ?? []).map(b => b.scene);
			if (cond.defaultScene) targets.push(cond.defaultScene);
			if (cond.scene) targets.push(cond.scene);
			return targets;
		}
		case "random-branch": {
			const random = action as ActionRandomBranchType;
			const targets = (random.branches ?? []).map(b => b.scene);
			if (random.defaultScene) targets.push(random.defaultScene);
			return targets;
		}
		default:
			return [];
	}
}

function reachableIndices(config: Action[]): Set<number> {
	const reachable = new Set<number>();
	const queue: number[] = [
		0,
	];

	while (queue.length) {
		const index = queue.pop()!;
		if (index < 0 || index >= config.length) continue;
		if (reachable.has(index)) continue;
		reachable.add(index);

		const action = config[index];
		if (action?.type === "go-to-scene") continue;
		queue.push(index + 1);
	}

	return reachable;
}

export function validateSceneConfig(
	config: Action[],
	knownScenes: string[] = [],
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	if (!config?.length) return issues;

	const hasKnownScenes = knownScenes.length > 0;
	const sceneExists = (scene: string) =>
		!hasKnownScenes || knownScenes.includes(scene);

	config.forEach((action, index) => {
		if (!action) return;

		for (const target of collectTargetScenes(action)) {
			if (!target) {
				issues.push({
					level: "error",
					index,
					message: "Scene reference is empty",
				});
			} else if (!sceneExists(target)) {
				issues.push({
					level: "error",
					index,
					message: `Unknown scene "${target}"`,
				});
			}
		}

		switch (action.type) {
			case "text":
				if (!(action.text ?? "").trim())
					issues.push({
						level: "warning",
						index,
						message: "Empty text",
					});
				break;
			case "background":
				if (!action.url)
					issues.push({
						level: "warning",
						index,
						message: "Background url is empty",
					});
				break;
			case "delay":
				if (action.ms <= 0)
					issues.push({
						level: "warning",
						index,
						message: "Delay must be greater than 0",
					});
				break;
			case "dialog-choice":
				if (!(action as ActionDialogChoiceType).choices.length)
					issues.push({
						level: "warning",
						index,
						message: "No choices defined",
					});
				break;
			case "play-music":
				if (!action.url)
					issues.push({
						level: "warning",
						index,
						message: "Music url is empty",
					});
				break;
			case "play-sound":
				if (!action.url)
					issues.push({
						level: "warning",
						index,
						message: "Sound url is empty",
					});
				break;
			case "show-character":
				if (!action.id)
					issues.push({
						level: "warning",
						index,
						message: "Missing id",
					});
				if (!action.url)
					issues.push({
						level: "warning",
						index,
						message: "Sprite url is empty",
					});
				break;
			case "hide-character":
			case "move-character":
				if (!action.id)
					issues.push({
						level: "warning",
						index,
						message: "Missing id",
					});
				break;
		}
	});

	const reachable = reachableIndices(config);
	config.forEach((_, index) => {
		if (!reachable.has(index))
			issues.push({
				level: "warning",
				index,
				message: "Unreachable action",
			});
	});

	return issues;
}
