import VEE from "@wxn0brp/event-emitter";
import { GameScene } from "./state";
import {
	Action,
	ActionBackgroundType,
	ActionDelayType,
	ActionDialogChoiceType,
	ActionTextType,
	ActionPlayMusicType,
	ActionStopMusicType,
	ActionPlaySoundType,
	ActionSetVolumeType,
	ActionShowCharacterType,
	ActionHideCharacterType,
	ActionMoveCharacterType,
	ActionSetVariableType,
	ActionConditionType,
	ActionRandomBranchType,
	ActionEffectType,
} from "./types";
import { evaluateExpression } from "./expression";
import { pickRandomBranch } from "./random";

export const actionEmitter = new VEE<{
	[event: string]: (
		cb: (...args: any[]) => any,
		action: Action,
		scene: GameScene,
		index: number,
	) => void;
}>();

export function sceneController(scene: GameScene): () => void {
	const onRunScene = (index: number) => {
		if (index >= scene.sceneConfig.length) {
			scene.eventEmitter.emit("scenes-end");
			return;
		}
		scene.lastIndex.set(index);
		runScene(scene, scene.sceneConfig[index], index);
	};
	const onPauseChange = (paused: boolean) => {
		if (paused) return;
		const index = scene.pausedIndex;
		if (index === null) return;
		scene.pausedIndex = null;
		scene.eventEmitter.emit("run-scene", index + 1);
	};
	scene.eventEmitter.on("run-scene", onRunScene);
	scene.pause.subscribe(onPauseChange);
	return () => scene.eventEmitter.off("run-scene", onRunScene);
}

async function runScene(scene: GameScene, action: Action, index: number) {
	if (!action) return console.error("No action", index, scene);

	const session = scene.sessionId;

	if (action.noWaitForEnd) {
		actionEmitter.emit(action.type, () => {}, action, scene, index);
	} else {
		await new Promise(resolve => {
			actionEmitter.emit(action.type, resolve, action, scene, index);
		});
	}

	if (scene.sessionId !== session) return;
	if (index === scene.sceneConfig.length - 1)
		return scene.eventEmitter.emit("scenes-end");

	if (scene.pause.get()) {
		scene.pausedIndex = index;
		return scene.eventEmitter.emit("pause", index);
	}

	scene.eventEmitter.emit("run-scene", index + 1);
}

actionEmitter.on("text", async (cb, action: ActionTextType, scene) => {
	scene.dialogEngine.writeAndConfirm(action.text).then(cb);
});

actionEmitter.on(
	"dialog-choice",
	async (cb, action: ActionDialogChoiceType, scene, index) => {
		scene
			.showChoices(action.choices)
			.then(choice => {
				actionEmitter.emit(
					"go-to-scene",
					() => {},
					{
						type: "go-to-scene",
						scene: choice.scene,
					},
					scene,
					-index,
				);
				cb();
			})
			.catch(err => {
				console.error(err);
				cb();
			});

		if (action.text) scene.dialogEngine.write(action.text);
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
	async (cb, action: ActionConditionType, scene, index) => {
		if (action.expression) {
			const matched = evaluateExpression(action.expression, {
				variables: scene.variableManager.getAll(),
				visited: name => scene.visitedScenes.has(name),
			});
			const target = matched ? action.scene : action.defaultScene;
			if (target) {
				actionEmitter.emit(
					"go-to-scene",
					() => {},
					{
						type: "go-to-scene",
						scene: target,
					},
					scene,
					-index,
				);
			}
			cb();
			return;
		}

		for (const branch of action.branches) {
			if (
				scene.variableManager.evaluate(
					branch.condition,
					branch.operator,
					branch.value,
				)
			) {
				actionEmitter.emit(
					"go-to-scene",
					() => {},
					{
						type: "go-to-scene",
						scene: branch.scene,
					},
					scene,
					-index,
				);
				cb();
				return;
			}
		}

		if (action.defaultScene) {
			actionEmitter.emit(
				"go-to-scene",
				() => {},
				{
					type: "go-to-scene",
					scene: action.defaultScene,
				},
				scene,
				-index,
			);
		}
		cb();
	},
);

actionEmitter.on(
	"random-branch",
	async (cb, action: ActionRandomBranchType, scene, index) => {
		const target = pickRandomBranch(action.branches) ?? action.defaultScene;
		if (target) {
			actionEmitter.emit(
				"go-to-scene",
				() => {},
				{
					type: "go-to-scene",
					scene: target,
				},
				scene,
				-index,
			);
		}
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
