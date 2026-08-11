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
} from "./types";

export const actionEmitter = new VEE<{
	[event: string]: (
		cb: (...args: any[]) => any,
		action: Action,
		scene: GameScene,
		index: number,
	) => void;
}>();

export function sceneController(scene: GameScene) {
	scene.eventEmitter.on("run-scene", (index: number) => {
		scene.lastIndex.set(index);
		runScene(scene, scene.sceneConfig[index], index);
	});
}

async function runScene(scene: GameScene, action: Action, index: number) {
	if (!action) return console.error("No action", index, scene);

	if (action.noWaitForEnd) {
		actionEmitter.emit(action.type, () => {}, action, scene, index);
	} else {
		await new Promise(resolve => {
			actionEmitter.emit(action.type, resolve, action, scene, index);
		});
	}

	if (index === scene.sceneConfig.length - 1)
		return scene.eventEmitter.emit("scenes-end");
	if (scene.pause.get()) return scene.eventEmitter.emit("pause", index);
	scene.eventEmitter.emit("run-scene", index + 1);
}

actionEmitter.on("text", async (cb, action: ActionTextType, scene) => {
	scene.dialogEngine.writeAndConfirm(action.text).then(cb);
});

actionEmitter.on(
	"dialog-choice",
	async (cb, action: ActionDialogChoiceType, scene, index) => {
		scene.showChoices(action.choices).then(choice => {
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

actionEmitter.on("delay", async (cb, action: ActionDelayType) => {
	setTimeout(cb, action.ms);
});

actionEmitter.on(
	"play-music",
	async (cb, action: ActionPlayMusicType, scene) => {
		await scene.audioEngine.playMusic(
			action.url,
			action.loop ?? true,
			action.fadeIn ?? 0,
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
