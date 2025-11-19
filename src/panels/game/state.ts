import VEE from "@wxn0brp/event-emitter";
import { DialogEngine } from "./dialog";
import { Action } from "./types";
import { GameEvents } from "./events";
import { ReactiveCell } from "@wxn0brp/flanker-ui";

export class GameScene {
    element: HTMLDivElement;
    background: HTMLImageElement;
    dialogEngine: DialogEngine;
    eventEmitter = new VEE<GameEvents>();

    sceneConfig: Action[] = [];
    lastIndex = new ReactiveCell(-1);
    pause = true;

    constructor(element: HTMLDivElement) {
        this.element = element;
        this.background = element.qs("#background");
        this.dialogEngine = new DialogEngine(element.qs("#dialog-box"));
    }

    setBackground(url: string) {
        this.background.src = url;
    }

    nextStep() {
        this.eventEmitter.emit("run-scene", this.lastIndex.get() + 1);
    }
}