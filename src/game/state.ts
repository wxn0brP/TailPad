import VEE from "@wxn0brp/event-emitter";
import { DialogEngine } from "./dialog";
import type { Action, ActionPath, Choice } from "./types";
import type { GameEvents } from "./events";
import { ReactiveCell } from "@wxn0brp/flanker-ui";
import { sceneController } from "./sceneController";
import { AudioEngine } from "./audio";
import { SpriteEngine } from "./sprite";
import { VariableManager } from "./variables";
import { renderRichText } from "./richText";

export interface ChoiceResult {
	index: number;
	choice: Choice;
}

export class GameScene {
	background: HTMLImageElement;
	dialogEngine: DialogEngine;
	audioEngine: AudioEngine;
	spriteEngine: SpriteEngine;
	variableManager: VariableManager;
	eventEmitter = new VEE<GameEvents>();
	choicesContainer: HTMLDivElement;

	sceneConfig: Action[] = [];
	cursor = new ReactiveCell<ActionPath>([
		0,
	]);
	pause = new ReactiveCell(true);
	autoMode = new ReactiveCell(false);
	skipMode = new ReactiveCell(false);
	stepOnce = false;
	visitedScenes = new Set<string>();
	sessionId = 0;
	private _pauseWaiters = new Set<() => void>();
	private _activeRuns = new Map<number, number>();
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
		this.pause.subscribe(paused => {
			if (!paused) this.releasePauseWaiters();
		});
		this._sceneControllerCleanup = sceneController(this);
	}

	get running() {
		return (this._activeRuns.get(this.sessionId) ?? 0) > 0;
	}

	beginRun(token: number) {
		this._activeRuns.set(token, (this._activeRuns.get(token) ?? 0) + 1);
	}

	endRun(token: number) {
		const count = (this._activeRuns.get(token) ?? 0) - 1;
		if (count > 0) this._activeRuns.set(token, count);
		else this._activeRuns.delete(token);
	}

	private pruneRuns() {
		for (const token of [
			...this._activeRuns.keys(),
		])
			if (token !== this.sessionId) this._activeRuns.delete(token);
	}

	waitForUnpause() {
		if (!this.pause.get()) return Promise.resolve();
		return new Promise<void>(resolve => {
			const waiter = () => {
				this._pauseWaiters.delete(waiter);
				resolve();
			};
			this._pauseWaiters.add(waiter);
			if (!this.pause.get()) waiter();
		});
	}

	releasePauseWaiters() {
		for (const waiter of [
			...this._pauseWaiters,
		])
			waiter();
	}

	beginSession(clearHistory = true) {
		this.sessionId++;
		this.pruneRuns();
		this.stepOnce = false;
		this.cursor.set([
			0,
		]);
		this.pause.set(true);
		this.releasePauseWaiters();
		this.dialogEngine.cancel();
		if (clearHistory) this.dialogEngine.history = [];
		this.spriteEngine.clearAll();
		this.choicesContainer.innerHTML = "";
		this.visitedScenes.clear();
	}

	interrupt() {
		this.sessionId++;
		this.pruneRuns();
		this.stepOnce = false;
		this.releasePauseWaiters();
		this.dialogEngine.cancel();
		this.choicesContainer.innerHTML = "";
	}

	setBackground(url: string) {
		this.background.src = url;
	}

	showChoices(choices: Choice[]): Promise<ChoiceResult> {
		this.choicesContainer.innerHTML = "";
		if (!choices?.length)
			return Promise.reject(new Error("No choices provided"));
		return new Promise(resolve => {
			choices.forEach((choice, index) => {
				const button = document.createElement("button");
				button.appendChild(
					renderRichText(choice.text, this.variableManager.getAll()),
				);
				button.onclick = () => {
					this.choicesContainer.innerHTML = "";
					resolve({
						index,
						choice,
					});
				};
				this.choicesContainer.appendChild(button);
			});
		});
	}

	nextStep() {
		this.stepOnce = true;
		this.pause.set(false);
		if (!this.running) this.eventEmitter.emit("run-scene", this.cursor.get());
	}

	runSceneAt(cursor: number | ActionPath) {
		this.eventEmitter.emit("run-scene", cursor);
	}

	dispose() {
		this.sessionId++;
		this.pruneRuns();
		this.releasePauseWaiters();
		this.dialogEngine.cancel();
		this.audioEngine.dispose();
		this.spriteEngine.dispose();
		this._sceneControllerCleanup?.();
	}
}
