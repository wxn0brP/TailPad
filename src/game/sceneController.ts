import VEE from "@wxn0brp/event-emitter";
import type { GameScene } from "./state";
import type {
	Action,
	ActionBackgroundType,
	ActionConditionType,
	ActionDelayType,
	ActionDialogChoiceType,
	ActionEffectType,
	ActionGoToSceneType,
	ActionHideCharacterType,
	ActionMoveCharacterType,
	ActionPath,
	ActionPlayMusicType,
	ActionPlaySoundType,
	ActionRandomBranchType,
	ActionSetVariableType,
	ActionSetVolumeType,
	ActionShowCharacterType,
	ActionStopMusicType,
	ActionTextType,
	InlineCase,
} from "./types";
import { evaluateExpression } from "./expression";
import { pickRandomIndex } from "./random";

export const actionEmitter = new VEE<{
	[event: string]: (
		cb: (...args: any[]) => any,
		action: Action,
		scene: GameScene,
		path: ActionPath,
	) => void;
}>();

export function sceneController(scene: GameScene): () => void {
	const onRunScene = (target: number | ActionPath) => {
		const cursor =
			typeof target === "number"
				? [
						Math.max(0, target),
					]
				: target;
		if (!cursor.length) return;
		const token = scene.sessionId;
		scene.beginRun(token);
		void runFrom(scene, scene.sceneConfig, [], cursor).finally(() =>
			scene.endRun(token),
		);
	};
	scene.eventEmitter.on("run-scene", onRunScene);
	return () => scene.eventEmitter.off("run-scene", onRunScene);
}

interface NestedPath {
	list: Action[];
	basePath: ActionPath;
	cursor: ActionPath;
	inlineCase?: InlineCase;
}

function decodePath(
	action: Action,
	basePath: ActionPath,
	index: number,
	rest: ActionPath,
): NestedPath | null {
	const head = rest[0];

	if (head === "choices" || head === "branches") {
		const caseIndex = Number(rest[1]);
		if (rest[2] !== "actions") return null;
		const cases = (action as any)[head];
		const inlineCase = cases?.[caseIndex] as InlineCase | undefined;
		if (!Array.isArray(inlineCase?.actions)) return null;
		return {
			list: inlineCase.actions,
			basePath: [
				...basePath,
				index,
				head,
				caseIndex,
				"actions",
			],
			cursor: rest.slice(3),
			inlineCase,
		};
	}

	if (
		head === "actions" ||
		head === "elseActions" ||
		head === "defaultActions"
	) {
		const list = (action as any)[head];
		if (!Array.isArray(list)) return null;
		return {
			list,
			basePath: [
				...basePath,
				index,
				head,
			],
			cursor: rest.slice(1),
			inlineCase: getInlineCase(action, head),
		};
	}

	return null;
}

function getInlineCase(action: Action, key: string): InlineCase | undefined {
	switch (action.type) {
		case "condition":
			if (key === "actions")
				return {
					actions: action.actions,
					scene: action.scene,
				};
			return {
				actions: (action as any)[key],
				scene: action.defaultScene,
			};
		case "random-branch":
			return {
				actions: action.defaultActions,
				scene: action.defaultScene,
			};
		default:
			return;
	}
}

async function runFrom(
	scene: GameScene,
	list: Action[],
	basePath: ActionPath,
	cursor: ActionPath,
): Promise<void> {
	const [head, ...rest] = cursor;
	const index = Number(head);
	if (!Number.isInteger(index) || index < 0) return;
	if (!rest.length) return runActions(scene, list, basePath, index);

	const action = list[index];
	if (!action) return;
	const nested = decodePath(action, basePath, index, rest);
	if (!nested) return runActions(scene, list, basePath, index);

	const token = scene.sessionId;
	await runFrom(scene, nested.list, nested.basePath, nested.cursor);
	if (scene.sessionId !== token) return;
	if (nested.inlineCase?.scene) {
		await goToScene(scene, nested.inlineCase.scene);
		return;
	}
	await runActions(scene, list, basePath, index + 1);
}

async function runActions(
	scene: GameScene,
	actions: Action[],
	basePath: ActionPath,
	start = 0,
): Promise<void> {
	const token = scene.sessionId;

	for (let i = start; i < actions.length; i++) {
		if (scene.sessionId !== token) return;
		const action = actions[i];
		if (!action) continue;
		const path = [
			...basePath,
			i,
		];
		scene.cursor.set(path);
		await waitWhilePaused(scene);
		if (scene.sessionId !== token) return;
		await executeAction(scene, action, path);
	}

	if (scene.sessionId !== token) return;
	if (!basePath.length) scene.eventEmitter.emit("scenes-end");
}

async function waitWhilePaused(scene: GameScene) {
	if (scene.stepOnce) {
		scene.stepOnce = false;
		scene.pause.set(true);
		scene.eventEmitter.emit("pause", scene.cursor.get());
		return;
	}

	if (!scene.pause.get()) return;
	scene.eventEmitter.emit("pause", scene.cursor.get());
	await scene.waitForUnpause();

	if (scene.stepOnce) {
		scene.stepOnce = false;
		scene.pause.set(true);
	}
}

async function executeAction(
	scene: GameScene,
	action: Action,
	path: ActionPath,
) {
	if (!actionEmitter.listenerCount(action.type)) {
		console.warn(`No handler for action type "${action.type}"`, path);
		return;
	}

	if (action.noWaitForEnd) {
		actionEmitter.emit(action.type, () => {}, action, scene, path);
		return;
	}

	await new Promise<void>(resolve => {
		actionEmitter.emit(action.type, resolve, action, scene, path);
	});
}

function getCases(action: Action): InlineCase[] {
	switch (action.type) {
		case "dialog-choice":
			return action.choices ?? [];
		case "condition": {
			if (action.expression?.trim())
				return [
					{
						actions: action.actions,
						scene: action.scene,
					},
					{
						actions: action.elseActions,
						scene: action.defaultScene,
					},
				];
			return [
				...(action.branches ?? []),
				{
					actions: action.defaultActions,
					scene: action.defaultScene,
				},
			];
		}
		case "random-branch":
			return [
				...(action.branches ?? []),
				{
					actions: action.defaultActions,
					scene: action.defaultScene,
				},
			];
		default:
			return [];
	}
}

function caseActionsPath(
	action: Action,
	path: ActionPath,
	caseIndex: number,
): ActionPath {
	if (action.type === "dialog-choice")
		return [
			...path,
			"choices",
			caseIndex,
			"actions",
		];

	if (action.type === "condition" && action.expression?.trim())
		return [
			...path,
			caseIndex === 0 ? "actions" : "elseActions",
		];

	const branchCount =
		action.type === "condition" || action.type === "random-branch"
			? (action.branches?.length ?? 0)
			: 0;

	if (caseIndex < branchCount)
		return [
			...path,
			"branches",
			caseIndex,
			"actions",
		];

	return [
		...path,
		"defaultActions",
	];
}

async function runCase(
	scene: GameScene,
	inlineCase: InlineCase | undefined,
	actionsPath: ActionPath,
) {
	if (!inlineCase) return;
	const token = scene.sessionId;

	if (inlineCase.actions?.length)
		await runActions(scene, inlineCase.actions, actionsPath);

	if (scene.sessionId !== token) return;
	if (inlineCase.scene) await goToScene(scene, inlineCase.scene);
}

async function goToScene(scene: GameScene, name: string) {
	if (!name) return;
	await new Promise<void>(resolve => {
		actionEmitter.emit(
			"go-to-scene",
			resolve,
			{
				type: "go-to-scene",
				scene: name,
			} as ActionGoToSceneType,
			scene,
			scene.cursor.get(),
		);
	});
}

actionEmitter.on("text", async (cb, action: ActionTextType, scene) => {
	scene.dialogEngine.writeAndConfirm(action.text).then(cb);
});

actionEmitter.on(
	"dialog-choice",
	async (cb, action: ActionDialogChoiceType, scene, path) => {
		if (action.text) scene.dialogEngine.write(action.text);

		try {
			const result = await scene.showChoices(action.choices);
			await runCase(
				scene,
				action.choices[result.index],
				caseActionsPath(action, path, result.index),
			);
		} catch (error) {
			console.error(error);
		}
		cb();
	},
);

actionEmitter.on(
	"background",
	async (cb, action: ActionBackgroundType, scene) => {
		scene.setBackground(action.url);
		cb();
	},
);

actionEmitter.on("delay", async (cb, action: ActionDelayType, scene) => {
	const ms = scene?.skipMode.get() ? Math.min(action.ms, 100) : action.ms;
	setTimeout(cb, ms);
});

actionEmitter.on(
	"play-music",
	async (cb, action: ActionPlayMusicType, scene) => {
		await scene.audioEngine.playMusic(
			action.url,
			action.loop ?? true,
			action.fadeIn ?? 0,
			action.force ?? false,
		);
		cb();
	},
);

actionEmitter.on(
	"stop-music",
	async (cb, action: ActionStopMusicType, scene) => {
		await scene.audioEngine.stopMusic(action.fadeOut ?? 0);
		cb();
	},
);

actionEmitter.on(
	"play-sound",
	async (cb, action: ActionPlaySoundType, scene) => {
		await scene.audioEngine.playSound(action.url, action.volume ?? 1.0);
		cb();
	},
);

actionEmitter.on(
	"set-volume",
	async (cb, action: ActionSetVolumeType, scene) => {
		scene.audioEngine.setVolume(action.channel, action.volume);
		cb();
	},
);

actionEmitter.on(
	"show-character",
	async (cb, action: ActionShowCharacterType, scene) => {
		await scene.spriteEngine.showCharacter(
			action.id,
			action.url,
			action.position,
			action.transition ?? "fade",
			action.transitionDuration ?? 500,
		);
		cb();
	},
);

actionEmitter.on(
	"hide-character",
	async (cb, action: ActionHideCharacterType, scene) => {
		await scene.spriteEngine.hideCharacter(
			action.id,
			action.transition ?? "fade",
			action.transitionDuration ?? 500,
		);
		cb();
	},
);

actionEmitter.on(
	"move-character",
	async (cb, action: ActionMoveCharacterType, scene) => {
		await scene.spriteEngine.moveCharacter(
			action.id,
			action.position,
			action.duration ?? 500,
		);
		cb();
	},
);

actionEmitter.on(
	"set-variable",
	async (cb, action: ActionSetVariableType, scene) => {
		scene.variableManager.set(
			action.name,
			action.value,
			action.operation ?? "set",
		);
		cb();
	},
);

actionEmitter.on(
	"condition",
	async (cb, action: ActionConditionType, scene, path) => {
		let caseIndex = -1;

		if (action.expression?.trim()) {
			const matched = evaluateExpression(action.expression, {
				variables: scene.variableManager.getAll(),
				visited: name => scene.visitedScenes.has(name),
			});
			caseIndex = matched ? 0 : 1;
		} else {
			const branches = action.branches ?? [];
			for (let i = 0; i < branches.length; i++) {
				const branch = branches[i];
				if (
					scene.variableManager.evaluate(
						branch.condition,
						branch.operator,
						branch.value,
					)
				) {
					caseIndex = i;
					break;
				}
			}
			if (caseIndex < 0) caseIndex = branches.length;
		}

		const inlineCase = getCases(action)[caseIndex];
		if (inlineCase)
			await runCase(
				scene,
				inlineCase,
				caseActionsPath(action, path, caseIndex),
			);
		cb();
	},
);

actionEmitter.on(
	"random-branch",
	async (cb, action: ActionRandomBranchType, scene, path) => {
		const branchCount = action.branches?.length ?? 0;
		const picked = pickRandomIndex(action.branches);
		const caseIndex = picked < 0 ? branchCount : picked;
		const inlineCase = getCases(action)[caseIndex];
		if (inlineCase)
			await runCase(
				scene,
				inlineCase,
				caseActionsPath(action, path, caseIndex),
			);
		cb();
	},
);

actionEmitter.on("effect", async (cb, action: ActionEffectType, scene) => {
	playEffect(scene, action.effect, action.duration ?? 500);
	cb();
});

function playEffect(scene: GameScene, effect: string, duration: number) {
	const element = scene.element;
	const className = `effect-${effect}`;
	element.style.setProperty("--effect-duration", `${duration}ms`);
	element.classList.remove(className);
	void element.offsetWidth;
	element.classList.add(className);
	setTimeout(() => element.classList.remove(className), duration);
}
