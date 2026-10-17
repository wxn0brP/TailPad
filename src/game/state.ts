import VEE from "@wxn0brp/event-emitter";
import { DialogEngine } from "./dialog";
import { Action, Choice } from "./types";
import { GameEvents } from "./events";
import { ReactiveCell } from "@wxn0brp/flanker-ui";
import { sceneController } from "./sceneController";
import { AudioEngine } from "./audio";
import { SpriteEngine } from "./sprite";
import { VariableManager } from "./variables";

export class GameScene {
	background: HTMLImageElement;
	dialogEngine: DialogEngine;
	audioEngine: AudioEngine;
	spriteEngine: SpriteEngine;
	variableManager: VariableManager;
	eventEmitter = new VEE<GameEvents>();
	choicesContainer: HTMLDivElement;

	sceneConfig: Action[] = [];
	lastIndex = new ReactiveCell(-1);
	pause = new ReactiveCell(true);
	autoMode = new ReactiveCell(false);
	skipMode = new ReactiveCell(false);
	visitedScenes = new Set<string>();
	private _sceneControllerCleanup: (() => void) | null = null;

	constructor(public element: HTMLDivElement) {
		this.background = element.qs("#background");
		this.variableManager = new VariableManager();
		this.dialogEngine = new DialogEngine(
			element.qs("#dialog-box"),
			this.pause,
			25,
			this.skipMode,
			this.autoMode,
			this.variableManager,
		);
		this.audioEngine = new AudioEngine();
		this.spriteEngine = new SpriteEngine(
			element.qs("#sprites-container") || element,
		);
		this.choicesContainer = element.qs("#choices-container");
		this._sceneControllerCleanup = sceneController(this);
	}

	setBackground(url: string) {
		this.background.src = url;
	}

	showChoices(choices: Choice[]): Promise<Choice> {
		this.choicesContainer.innerHTML = "";
		if (!choices?.length)
			return Promise.reject(new Error("No choices provided"));
		return new Promise(resolve => {
			for (const choice of choices) {
				const button = document.createElement("button");
				button.textContent = choice.text;
				button.onclick = () => {
					this.choicesContainer.innerHTML = "";
					resolve(choice);
				};
				this.choicesContainer.appendChild(button);
			}
		});
	}

	nextStep() {
		this.eventEmitter.emit("run-scene", this.lastIndex.get() + 1);
	}

	dispose() {
		this.dialogEngine.cancel();
		this.audioEngine.dispose();
		this.spriteEngine.dispose();
		this._sceneControllerCleanup?.();
	}
}
