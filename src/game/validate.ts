import type {
	Action,
	ActionConditionType,
	ActionDialogChoiceType,
	ActionPath,
	ActionRandomBranchType,
	InlineCase,
} from "./types";

export interface ValidationIssue {
	level: "error" | "warning";
	path: ActionPath;
	message: string;
}

const MAX_DEPTH = 8;

interface ValidateContext {
	knownScenes: string[];
	issues: ValidationIssue[];
}

function issue(
	ctx: ValidateContext,
	level: "error" | "warning",
	path: ActionPath,
	message: string,
) {
	ctx.issues.push({
		level,
		path,
		message,
	});
}

function checkSceneRef(
	ctx: ValidateContext,
	scene: string | undefined,
	path: ActionPath,
	required: boolean,
) {
	if (!scene) {
		if (required) issue(ctx, "error", path, "Scene reference is empty");
		return;
	}
	if (ctx.knownScenes.length && !ctx.knownScenes.includes(scene))
		issue(ctx, "error", path, `Unknown scene "${scene}"`);
}

function walkCase(
	ctx: ValidateContext,
	inlineCase: InlineCase | undefined,
	actionsPath: ActionPath,
	scenePath: ActionPath,
	depth: number,
) {
	if (!inlineCase) return;
	checkSceneRef(ctx, inlineCase.scene, scenePath, false);
	if (inlineCase.actions?.length)
		walkActions(ctx, inlineCase.actions, actionsPath, depth + 1);
}

function walkActions(
	ctx: ValidateContext,
	actions: Action[],
	basePath: ActionPath,
	depth: number,
) {
	if (depth > MAX_DEPTH) return;

	let reachedEnd = false;

	actions.forEach((action, index) => {
		const path: ActionPath = [
			...basePath,
			index,
		];
		if (!action) return;
		if (reachedEnd) {
			issue(ctx, "warning", path, "Unreachable action after go-to-scene");
			return;
		}

		if (action.noWaitForEnd && isBranch(action))
			issue(
				ctx,
				"warning",
				path,
				"noWaitForEnd is not supported on branch actions",
			);

		switch (action.type) {
			case "go-to-scene":
				checkSceneRef(ctx, action.scene, path, true);
				reachedEnd = true;
				return;
			case "text":
				if (!(action.text ?? "").trim())
					issue(ctx, "warning", path, "Empty text");
				return;
			case "background":
				if (!action.url) issue(ctx, "warning", path, "Background url is empty");
				return;
			case "delay":
				if (action.ms <= 0)
					issue(ctx, "warning", path, "Delay must be greater than 0");
				return;
			case "play-music":
				if (!action.url) issue(ctx, "warning", path, "Music url is empty");
				return;
			case "play-sound":
				if (!action.url) issue(ctx, "warning", path, "Sound url is empty");
				return;
			case "show-character":
				if (!action.id) issue(ctx, "warning", path, "Missing id");
				if (!action.url) issue(ctx, "warning", path, "Sprite url is empty");
				return;
			case "hide-character":
			case "move-character":
				if (!action.id) issue(ctx, "warning", path, "Missing id");
				return;
			case "set-variable":
				if (!action.name) issue(ctx, "warning", path, "Variable name is empty");
				return;
			case "dialog-choice":
				walkDialogChoice(ctx, action, path, depth);
				return;
			case "condition":
				walkCondition(ctx, action, path, depth);
				return;
			case "random-branch":
				walkRandomBranch(ctx, action, path, depth);
				return;
		}
	});
}

function walkDialogChoice(
	ctx: ValidateContext,
	action: ActionDialogChoiceType,
	path: ActionPath,
	depth: number,
) {
	const choices = action.choices ?? [];
	if (!choices.length) issue(ctx, "warning", path, "No choices defined");

	choices.forEach((choice, index) => {
		const choicePath: ActionPath = [
			...path,
			"choices",
			index,
		];
		const actionsPath: ActionPath = [
			...choicePath,
			"actions",
		];
		if (!choice.text) issue(ctx, "warning", choicePath, "Choice text is empty");
		if (!choice.actions?.length && !choice.scene)
			issue(
				ctx,
				"warning",
				choicePath,
				"Choice has no actions or scene (merges immediately)",
			);
		walkCase(ctx, choice, actionsPath, choicePath, depth);
	});

	if (depth >= MAX_DEPTH) issue(ctx, "warning", path, "Nesting is too deep");
}

function walkCondition(
	ctx: ValidateContext,
	action: ActionConditionType,
	path: ActionPath,
	depth: number,
) {
	if (action.expression?.trim()) {
		walkCase(
			ctx,
			{
				actions: action.actions,
				scene: action.scene,
			},
			[
				...path,
				"actions",
			],
			path,
			depth,
		);
		walkCase(
			ctx,
			{
				actions: action.elseActions,
				scene: action.defaultScene,
			},
			[
				...path,
				"elseActions",
			],
			path,
			depth,
		);
	} else {
		const branches = action.branches ?? [];
		if (
			!branches.length &&
			!action.defaultActions?.length &&
			!action.defaultScene
		)
			issue(ctx, "warning", path, "No branches defined");

		branches.forEach((branch, index) => {
			const branchPath: ActionPath = [
				...path,
				"branches",
				index,
			];
			walkCase(
				ctx,
				branch,
				[
					...branchPath,
					"actions",
				],
				branchPath,
				depth,
			);
		});

		walkCase(
			ctx,
			{
				actions: action.defaultActions,
				scene: action.defaultScene,
			},
			[
				...path,
				"defaultActions",
			],
			path,
			depth,
		);
	}

	if (depth >= MAX_DEPTH) issue(ctx, "warning", path, "Nesting is too deep");
}

function walkRandomBranch(
	ctx: ValidateContext,
	action: ActionRandomBranchType,
	path: ActionPath,
	depth: number,
) {
	const branches = action.branches ?? [];
	if (
		!branches.length &&
		!action.defaultActions?.length &&
		!action.defaultScene
	)
		issue(ctx, "warning", path, "No branches defined");

	branches.forEach((branch, index) => {
		if ((branch.weight ?? 1) <= 0)
			issue(ctx, "warning", path, "Branch weight must be greater than 0");
		const branchPath: ActionPath = [
			...path,
			"branches",
			index,
		];
		walkCase(
			ctx,
			branch,
			[
				...branchPath,
				"actions",
			],
			branchPath,
			depth,
		);
	});

	walkCase(
		ctx,
		{
			actions: action.defaultActions,
			scene: action.defaultScene,
		},
		[
			...path,
			"defaultActions",
		],
		path,
		depth,
	);

	if (depth >= MAX_DEPTH) issue(ctx, "warning", path, "Nesting is too deep");
}

function isBranch(action: Action) {
	return (
		action.type === "dialog-choice" ||
		action.type === "condition" ||
		action.type === "random-branch"
	);
}

export function validateSceneConfig(
	config: Action[],
	knownScenes: string[] = [],
): ValidationIssue[] {
	const ctx: ValidateContext = {
		knownScenes,
		issues: [],
	};
	if (!config?.length) return ctx.issues;

	walkActions(ctx, config, [], 0);
	return ctx.issues;
}
